/**
 * Arabic Transliteration Utility
 * Converts Latin characters to Arabic script based on a predefined mapping
 */

export const ARABIC_TRANSLITERATION_MAP: Record<string, string> = {
  // Single letters
  'a': 'أ', 'A': 'أ',
  'b': 'ب', 'B': 'ب',
  'c': 'ج', 'C': 'ج',
  'd': 'د', 'D': 'د',
  'e': 'ه', 'E': 'ه',
  'f': 'و', 'F': 'و',
  'g': 'ز', 'G': 'ز',
  'h': 'ح', 'H': 'ح',
  'i': 'ي', 'I': 'ي',
  'j': 'ج', 'J': 'ج',
  'k': 'ك', 'K': 'ك',
  'l': 'ل', 'L': 'ل',
  'm': 'م', 'M': 'م',
  'n': 'ن', 'N': 'ن',
  'o': 'و', 'O': 'و',
  'p': 'ب', 'P': 'ب',
  'q': 'ق', 'Q': 'ق',
  'r': 'ر', 'R': 'ر',
  's': 'س', 'S': 'س',
  't': 'ت', 'T': 'ت',
  'u': 'ع', 'U': 'ع',
  'v': 'ف', 'V': 'ف',
  'w': 'و', 'W': 'و',
  'x': 'خ', 'X': 'خ',
  'y': 'ي', 'Y': 'ي',
  'z': 'ز', 'Z': 'ز',
};

/**
 * Transliterate a single character from Latin to Arabic
 * Returns the original character if no mapping exists
 */
export function transliterateChar(char: string): string {
  return ARABIC_TRANSLITERATION_MAP[char] ?? char;
}

/**
 * Transliterate text from Latin to Arabic
 * Processes each character and applies the transliteration mapping
 */
export function transliterateText(text: string): string {
  return text.split('').map(char => transliterateChar(char)).join('');
}

/**
 * Handle Arabic transliteration on input change
 * This function should be called from onChange events on input/textarea elements
 * 
 * @param currentText - The current text value
 * @param previousText - The previous text value (to detect what changed)
 * @returns Object with isArabic flag and suggested text
 */
export function getArabicTransliterationSuggestion(
  currentText: string,
  previousText: string
): { shouldReplace: boolean; newText: string } {
  // If no change detected or text got shorter (likely a delete), don't auto-transliterate
  if (currentText.length <= previousText.length) {
    return { shouldReplace: false, newText: currentText };
  }

  // Get the newly added characters
  const addedChars = currentText.substring(previousText.length);
  
  // Check if any of the added characters are Latin letters that should be transliterated
  const hasLatinLetters = /[a-zA-Z]/.test(addedChars);
  
  if (!hasLatinLetters) {
    return { shouldReplace: false, newText: currentText };
  }

  // Transliterate the entire text
  const newText = transliterateText(currentText);
  
  // Only suggest replacement if the text actually changed
  if (newText !== currentText) {
    return { shouldReplace: true, newText };
  }

  return { shouldReplace: false, newText: currentText };
}

/**
 * Hook helper to handle Arabic input on change
 * Call this from onChange handlers to enable real-time transliteration
 */
export function useArabicInputHandler(
  isArabicMode: boolean,
  onChangeCallback: (value: string) => void,
  previousValueRef: React.MutableRefObject<string>
) {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const currentValue = e.target.value;
    
    if (isArabicMode) {
      const { shouldReplace, newText } = getArabicTransliterationSuggestion(
        currentValue,
        previousValueRef.current
      );
      
      if (shouldReplace) {
        // Update the callback with transliterated text
        onChangeCallback(newText);
        // Update the ref for next comparison
        previousValueRef.current = newText;
        // Update the input value immediately
        e.target.value = newText;
        return;
      }
    }
    
    onChangeCallback(currentValue);
    previousValueRef.current = currentValue;
  };
}
