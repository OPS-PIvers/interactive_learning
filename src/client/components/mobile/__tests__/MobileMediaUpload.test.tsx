import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MobileMediaUpload } from '../MobileMediaUpload';
import { vi } from 'vitest';

vi.mock('../../../lib/firebaseApi', () => ({
  uploadFile: vi.fn((file) => Promise.resolve(`https://fake-storage.com/${file.name}`)),
}));

describe('MobileMediaUpload', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MobileMediaUpload label="Upload Media" onUpload={() => {}} />);
    expect(getByText('Click to upload')).toBeInTheDocument();
  });

  it('calls onUpload with the file URL after a successful upload', async () => {
    const handleUpload = vi.fn();
    const { getByLabelText } = render(<MobileMediaUpload label="Upload Media" onUpload={handleUpload} />);
    const fileInput = getByLabelText('Click to upload');
    const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(handleUpload).toHaveBeenCalledWith(file);
    });
  });
});
