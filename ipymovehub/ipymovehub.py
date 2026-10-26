# # Distributed under the terms of the Modified BSD License.

# This file comes from https://github.com/jupyter-robotics/ipylgbst and has been adapted for the current extension
#
# It is licensed under the following license:
#
# BSD License

#Copyright (c) Dr Thorsten Beier

#Permission is hereby granted, free of charge, to any person obtaining a copy
#of this software and associated documentation files (the "Software"), to deal
#in the Software without restriction, including without limitation the rights
#to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
#copies of the Software, and to permit persons to whom the Software is
#furnished to do so, subject to the following conditions:

#The above copyright notice and this permission notice shall be included in all
#copies or substantial portions of the Software.



from ipywidgets import DOMWidget, Output
from traitlets import Unicode, Int, Float, Bool, Complex, Dict
from ._frontend import module_name, module_version

import asyncio

from enum import Enum
from contextlib import contextmanager, redirect_stdout

import math
import uuid


def wait_for_change(widget, value):
    """
    Wait for a change in a widget's value.

    The trait change may be notified from another thread than the one
    running the event loop awaiting the future (the frontend-to-kernel
    comm message handling), so the future is resolved thread-safely on
    the loop it was created on.
    """
    future = asyncio.Future()

    def getvalue(change):
        widget.unobserve(getvalue, value)

        def apply():
            if not future.done():
                future.set_result(change.new)

        try:
            future.get_loop().call_soon_threadsafe(apply)
        except RuntimeError:
            # The loop is closed: nothing is awaiting the change.
            pass

    widget.observe(getvalue, value)
    return future

class Task:
    """ The task class that can be awaited and has a future as a private property"""

    def __init__(self, widget, task_uuid, task_type):
        self._future = asyncio.Future()
        self._task_uuid = task_uuid
        self._task_type =  task_type
        self._widget = widget

    def __await__(self):
        return self._future.__await__()

    def cancel(self):
        """Method to cancel a task."""
        self._widget.send({
            "event": "cancel-task",
            "task_uuid": self._task_uuid,
            "task_type": self._task_type
        })

        self._future.cancel()

    def _set_cancelled(self):
        self._resolve_future(cancelled=True)

    def _set_result(self):
        self._resolve_future(cancelled=False)

    def _resolve_future(self, cancelled):
        """Wake up the cell awaiting this task.

        The comm message from the frontend may be processed on another
        thread than the one running the event loop awaiting the task, so
        the future must be resolved thread-safely on the loop it was
        created on.
        """
        if self._future.done():
            return
        loop = self._future.get_loop()

        def apply():
            if not self._future.done():
                if cancelled:
                    self._future.cancel()
                else:
                    self._future.set_result("finished")

        try:
            loop.call_soon_threadsafe(apply)
        except RuntimeError:
            # The loop is closed: nothing is awaiting the task.
            pass

    def done(self):
       """ Method returnin True if the task has finished running."""
       return self._future.done()

    def cancelled(self):
        """Method returning True if the task was cancelled before completing successfully."""
        return self._future.cancelled()

class LedColor(str, Enum):
    """
    The color of the LED on the Boost Move Hub.
    """

    off = "off"
    pink = "pink"
    purple = "purple"
    blue = "blue"
    lightblue = "lightblue"
    cyan = "cyan"
    green = "green"
    yellow = "yellow"
    orange = "orange"
    red = "red"


class Port(str, Enum):
    """
    The ports on the Boost Move Hub.
    """

    A = "A"
    B = "B"
    AB = "AB"
    C = "C"
    D = "D"


# The bounds of the arguments are fixed by the Boost Move Hub BLE
# protocol: durations are sent in milliseconds as an unsigned 16-bit
# integer, powers as a signed 8-bit integer and angles as an unsigned
# 32-bit integer.
MAX_SECONDS = 65.535
MIN_POWER = -100
MAX_POWER = 100
MAX_ANGLE = 2147483647


def _validate_port(port):
    """Normalize and validate a motor port, raising ValueError on an unknown port."""
    if isinstance(port, Port):
        return port.value
    if isinstance(port, str) and port in (p.value for p in Port):
        return port
    valid = ", ".join(p.value for p in Port)
    raise ValueError(f"port must be one of {valid}, got {port!r}")


def _validate_power(power, name):
    """Validate a motor power percentage, raising ValueError when out of bounds."""
    if not (MIN_POWER <= power <= MAX_POWER):
        raise ValueError(
            f"{name} must be between {MIN_POWER} and {MAX_POWER}, got {power}"
        )
    return power


def _validate_seconds(seconds):
    """Validate a motor run time in seconds, raising ValueError when out of bounds."""
    if not (0 <= seconds <= MAX_SECONDS):
        raise ValueError(
            f"seconds must be between 0 and {MAX_SECONDS} (protocol limit), got {seconds}"
        )
    return seconds


def _validate_angle(angle):
    """Validate a motor angle in degrees, raising ValueError when out of bounds."""
    if not (0 <= angle <= MAX_ANGLE):
        raise ValueError(
            f"angle must be between 0 and {MAX_ANGLE} (protocol limit), got {angle}"
        )
    return angle


class Sensor(object):
    """
    The sensor on the Boost Move Hub.
    """

    def __init__(self, name):
        self.name = name

    def value(self, movehub):
        if self.name == "distance":
            return movehub.get_distance()
        elif self.name == "color":
            return movehub.get_color()
        else:
            raise NotImplementedError


DEFAULT_PORT_INFO = {"action": "", "angle": 0}

DEFAULT_DEVICE_INFO = {
    "command_frame": 0,
    "polling_frame": 0,
    "ports": {
        "A": DEFAULT_PORT_INFO,
        "B": DEFAULT_PORT_INFO,
        "AB": DEFAULT_PORT_INFO,
        "C": DEFAULT_PORT_INFO,
        "D": DEFAULT_PORT_INFO,
        "LED": DEFAULT_PORT_INFO,
        "rssi": 0,
        "color": None,
        "connected": False,
    },
    "tilt": {"roll": 0, "pitch": 0, "yaw": 0},
    "distance": None,
    "lane_cmd_index": [0, 0, 0],
}


class MoveHubWidget(DOMWidget):
    """MoveHub Widget"""
    _model_name = Unicode("MoveHubModel").tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode("MoveHubView").tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)
    # The device info is pushed by the frontend over the custom comm
    # channel and applied through `set_state`; echoing those updates
    # back to the frontend would be pure overhead.
    _device_info = Dict(
        DEFAULT_DEVICE_INFO, read_only=True
    ).tag(sync=True, echo_update=False)
    name = Unicode("device1").tag(sync=True)
    identifier = Unicode("").tag(sync=True)

    def __init__(self, *args, **kwargs):
        super(MoveHubWidget, self).__init__(*args, **kwargs)
        self.on_msg(self._handle_custom_comm_msg)
        self._pending_tasks = {}

    def _create_task(self, task_type, data):
        task_uuid = str(uuid.uuid4())
        task_type = task_type
        task = Task(widget = self,task_uuid=task_uuid, task_type=task_type)
        self._pending_tasks[task_uuid] = task

        self.send({
            "event": "start-task",
            "task_uuid": task_uuid,
            "task_type": task_type,
            "data": data
        })
        return task

    #
    def _handle_custom_comm_msg(self, _,  content, buffers):
        """Private method that handles with the different comm messages received from the frontend"""
        event = content.get("event")

        # The device info is pushed by the frontend as a custom message
        # instead of the widget state sync (which is throttled to one
        # in-flight message on some stacks and can stall permanently,
        # see https://github.com/jupyter-widgets/ipywidgets/issues/4048).
        if event == "device-info":
            self.set_state({"_device_info": content.get("data", {})})
            return

        task_uuid = content.get("task_uuid")
        task_type = content.get("task_type")
        task = self._pending_tasks.get(task_uuid)
        
        if task is not None:
            if not task.done():
                if event == "task-finished":
                    task._set_result()

                if event == "task-cancelled":
                    task._set_cancelled()

            del self._pending_tasks[task_uuid]
    
    def connect(self, identifier = None):
        """ Method to create a task with connect as task_type"""
        if identifier is None:
            identifier = self.identifier
        return self._create_task(task_type="connect", data={})
    
    def disconnect(self, identifier = None):
        """ Method to create a task with disconnect as task_type"""
        if identifier is None:
            identifier = self.identifier
        return self._create_task(task_type="disconnect", data={}) 

    async def _poll(self):
        """Wait for the device info to be updated.

        The state pushed by the frontend is applied to the trait value
        even when trait change notifications are suppressed (which can
        happen on some kernels when a `hold_trait_notifications` context
        is left dangling by a cancelled comm message task), so the frame
        counter is polled directly instead of relying on trait
        observers.
        """
        last_frame = self._device_info.get("polling_frame")
        while True:
            await asyncio.sleep(1 / 60)
            current_frame = self._device_info.get("polling_frame")
            if current_frame != last_frame:
                return
            last_frame = current_frame

    async def get_distance_async(self):
        """Get the distance from an obstacle"""
        await self._poll()
        d = self._device_info["distance"]
        if d is None:
            d = float("inf")
        if math.isfinite(d) and d > 255.0:
            d = 255.0
        return d

    async def get_roll_async(self):
        """Get the roll angle of the Boost Move Hub."""
        await self._poll()
        return self._device_info["tilt"]["roll"]

    async def get_pitch_async(self):
        """Get the pitch angle of the Boost Move Hub."""
        await self._poll()
        return self._device_info["tilt"]["pitch"]

    async def get_color_async(self):
        """Get the color of the Boost Move Hub."""
        await self._poll()
        return self._device_info["color"]

    def motor_angle(self, port, angle, power):
        """
            Turn a motor for a given angle:

            Args:
                port (Port): The port of the motor.
                angle (float): The angle in degrees, from `0` to `2147483647`.
                power (int): The power of the motor, from `-100` to `100`.

        """
        port = _validate_port(port)
        _validate_angle(angle)
        _validate_power(power, "power")
        wait = True
        return self._create_task(task_type="motor-angle", data={"port": port, "angle": angle, "power": power, "wait": wait})

    def motor_angle_multi(self, angle, power_a, power_b):
        """
            Turn both motors for a given angle:

            Args:
                angle (float): The angle in degrees, from `0` to `2147483647`.
                power_a (int): The power of motor A, from `-100` to `100`.
                power_b (int): The power of motor B, from `-100` to `100`.
            
        """
        _validate_angle(angle)
        _validate_power(power_a, "power_a")
        _validate_power(power_b, "power_b")
        wait = True
        return self._create_task(task_type="motor-angle-multi", data= {"angle": angle, "power_a": power_a, "power_b": power_b, "wait": wait})

    def motor_time(self, port, seconds, power):
        """
            Turn a motor for a given time:
            
            Args:
                port (Port): The port of the motor.
                seconds (float): The time in seconds, from `0` to `65.535`.
                power (int): The power of the motor, from `-100` to `100`.

        """
        port = _validate_port(port)
        _validate_seconds(seconds)
        _validate_power(power, "power")
        wait = True
       
        return self._create_task(task_type="motor-time", data={"port": port, "seconds": seconds, "power": power, "wait": wait})

    def motor_time_multi(self, seconds, power_a, power_b):
        """
            Turn both motors for a given time:

            Args:
                seconds (float): The time in seconds, from `0` to `65.535`.
                power_a (int): The power of motor A, from `-100` to `100`.
                power_b (int): The power of motor B, from `-100` to `100`.
            
        """
        _validate_seconds(seconds)
        _validate_power(power_a, "power_a")
        _validate_power(power_b, "power_b")
        wait = True
        
        return self._create_task(task_type="motor-time-multi", data={"seconds": seconds, "power_a": power_a, "power_b": power_b, "wait": wait})
        

    def set_led(self, color):
        """ Set the color of the LED on the Boost Move Hub.

            Args:
                color (LedColor): The color of the LED.
            
        """
     
        if isinstance(color, LedColor):
                color = color.value
                
        return self._create_task(task_type="set-led", data={"color": color})