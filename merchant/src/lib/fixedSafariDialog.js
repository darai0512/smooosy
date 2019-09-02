

// iOS Safariでダイアログの裏が背景スクロールする不具合の対策
export const setFixedOnIOS = () => {
  if (/iP(hone|od|ad)/.test(navigator.userAgent)) {
    // 背景スクロールを固定する
    const body = document.querySelector('body')
    body.style.position = 'fixed'
  }
}

// 背景固定解除
// ダイアログonClose、componentWillUnmountで必ず呼ぶこと！
export const removeFixedOnIOS = () => {
  if (/iP(hone|od|ad)/.test(navigator.userAgent)) {
    // 背景スクロール可能にする
    const body = document.querySelector('body')
    body.style.position = 'static'
  }
}
