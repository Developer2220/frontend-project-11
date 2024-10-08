export default (data) => {
  const parser = new DOMParser();
  const xmlDocument = parser.parseFromString(data, 'application/xml');

  const parseError = xmlDocument.querySelector('parsererror');

  if (parseError) {
    const error = new Error(parseError.textContent = 'notRss');
    error.isParseError = true;
    throw error;
  }

  const channel = xmlDocument.querySelector('channel');
  const channelTitle = xmlDocument.querySelector('channel title').textContent;
  const channelDescription = xmlDocument.querySelector('channel description').textContent;
  const feed = { channelTitle, channelDescription };

  const itemElements = channel.getElementsByTagName('item');

  const posts = [...itemElements].map((item) => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('channel link').textContent;
    return {
      title,
      description,
      link,
    };
  });

  const parsedRSS = { feed, posts };

  return parsedRSS;
};
