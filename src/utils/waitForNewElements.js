export function waitForNewElements({
  container,
  selector,
  prevCount,
  timeout = 5000,
}) {
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const newCount = container.querySelectorAll(selector).length;
      if (newCount > prevCount) {
        observer.disconnect();
        resolve(newCount);
      }
    });

    observer.observe(container, { childList: true, subtree: true });

    // fallback timeout (important, or it might hang forever)
    setTimeout(() => {
      observer.disconnect();
      resolve(prevCount);
    }, timeout);
  });
}
