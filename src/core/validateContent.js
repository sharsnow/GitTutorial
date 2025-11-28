
// 處理cotent的訊息 避免過長或是特殊文字

const MAX_LENGTH = 300;
const MAX_LINES = 10;

export const validateInput = (text) => {
  // 1. 檢查總長度
  if (text.length > MAX_LENGTH) {
    return { 
      isValid: false, 
      message: `內容太長囉！請保持在 ${MAX_LENGTH} 字以內。` 
    };
  }

  // 2. 檢查行數 (透過換行符號 \n 計算)
  const lines = text.split('\n');
  if (lines.length > MAX_LINES) {
    return { 
      isValid: false, 
      message: `行數太多囉！為了方便觀察衝突，請保持在 ${MAX_LINES} 行以內。` 
    };
  }

  // 3. (選用) 檢查單行過長 (避免水平捲軸無限延伸)
  const isLineTooLong = lines.some(line => line.length > 50);
  if (isLineTooLong) {
     return { 
      isValid: false, 
      message: `單行文字太長，請適度換行。` 
    };
  }

  return { isValid: true, message: '' };
};