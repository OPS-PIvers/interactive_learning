export const shareNatively = async (title: string, text: string, url: string) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      console.log('Content shared successfully');
    } catch (error) {
      console.error('Error sharing content:', error);
    }
  } else {
    console.log('Web Share API not supported');
    // Fallback for browsers that do not support the Web Share API
    // For example, copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }
};
