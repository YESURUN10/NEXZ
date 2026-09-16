import md5 from 'md5';
export const hashArticleUrl = (url) => md5(url || '');
