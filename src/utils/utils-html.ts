// 이미지 주소 변환 naver용
const replaceHtml_naver = (html: string): string => {
  return html.replace(/\?type=w\d+_blur/g, "?type=w966");
}

export {
  replaceHtml_naver,
}