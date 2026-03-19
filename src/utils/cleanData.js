export function cleanData(data) {
  return data.filter((item) => {
    // Remove null / undefined
    if (!item) return false;

    // Remove empty objects {}
    if (Object.keys(item).length === 0) return false;

    return true;
  });
}
