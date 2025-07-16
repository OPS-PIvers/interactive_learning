export const shareNatively = async (title: string, text: string, url: string): Promise<'shared' | 'copied' | 'failed'> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      console.log('Content shared successfully');
      return 'shared';
    } catch (error) {
      // Handle AbortError gracefully (user cancelled sharing)
      if ((error as Error)?.name === 'AbortError') {
        console.log('User cancelled sharing');
        return 'failed';
      }
      console.error('Error sharing content:', error);
      
      // Fallback to clipboard if share fails
      try {
        await navigator.clipboard.writeText(url);
        console.log('Fallback: Link copied to clipboard');
        return 'copied';
      } catch (clipboardError) {
        console.error('Failed to copy to clipboard:', clipboardError);
        return 'failed';
      }
    }
  } else {
    console.log('Web Share API not supported, using clipboard fallback');
    // Fallback for browsers that do not support the Web Share API
    try {
      await navigator.clipboard.writeText(url);
      console.log('Link copied to clipboard');
      return 'copied';
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return 'failed';
    }
  }
};
