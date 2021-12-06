import figlet from "figlet";

/**
 * Transform a normal text to ASCII-ART font style.
 * @param {string} - text to transform.
 * @returns {string} - text in ascii-art format.
 */
export const asciiArt = (text: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    figlet(text, (err: Error | null, data: string | undefined) => {
      if (err) resolve(text);
      resolve(data || text);
    });
  });
};
