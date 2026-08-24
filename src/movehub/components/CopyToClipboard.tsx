import React from 'react';
import copySVG from '../style/copy.svg';
const copySVGUrl = `data:image/svg+xml;base64,${btoa(copySVG)}`;

interface ICopyToClipboardProps {
  textToCopy: string;
}
export default function CopyToClipboard({ textToCopy }: ICopyToClipboardProps) {
  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
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
      <div>ID: </div>
      <input
        className="input-movehub-id"
        type="text"
        value={textToCopy}
        placeholder={textToCopy}
      />
      <button
        className="copy-button"
        onClick={handleCopyClick}
        title={'Copy ID'}
      >
        <img src={copySVGUrl} alt={'Button with copy icon'} />
      </button>
    </div>
  );
}
