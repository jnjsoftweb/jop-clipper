// 이미지 주소 변환 naver용
const postHtml_naver = (html: string): string => {
  return html.replace(/\?type=w\d+_blur/g, "?type=w966");
}

export {
  postHtml_naver,
}