import React from 'react';
import { LabIcon, ToolbarButtonComponent } from '@jupyterlab/ui-components';
import copySVG from '../../../style/icons/copy.svg';

export const copyIcon = new LabIcon({
  name: 'movehub:copy',
  svgstr: copySVG
});

interface ICopyButtonProps {
  textToCopy: string;
  title?: string;
}

/**
 * A toolbar button copying the given text to the clipboard.
 */
export function CopyButton({
  textToCopy,
  title = 'Copy ID'
}: ICopyButtonProps) {
  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  return (
    <ToolbarButtonComponent
      icon={copyIcon}
      onClick={handleCopyClick}
      tooltip={title}
    />
  );
}

interface ICopyToClipboardProps {
  textToCopy: string;
}
export default function CopyToClipboard({ textToCopy }: ICopyToClipboardProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '250px',
        gap: '10px',
        margin: '4px 0'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '220px',
          height: '30px'
        }}
      >
        {textToCopy}{' '}
      </div>
      <CopyButton textToCopy={textToCopy} />
    </div>
  );
}
