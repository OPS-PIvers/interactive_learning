export const shareNatively = async (title: string, text: string, url: string): Promise<'shared' | 'copied' | 'failed'> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url
      });

      return 'shared';
    } catch (error) {
      // Handle AbortError gracefully (user cancelled sharing)
      if ((error as Error)?.name === 'AbortError') {

        return 'failed';
      }
      console.error('Error sharing content:', error);

      // Fallback to clipboard if share fails
      try {
        await navigator.clipboard.writeText(url);

        return 'copied';
      } catch (clipboardError) {
        console.error('Failed to copy to clipboard:', clipboardError);
        return 'failed';
      }
    }
  } else {

    // Fallback for browsers that do not support the Web Share API
    try {
      await navigator.clipboard.writeText(url);

      return 'copied';
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return 'failed';
    }
  }
};