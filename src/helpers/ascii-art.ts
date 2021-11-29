import figlet from "figlet";

export const asciiArt = (text: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    figlet(text, (err: Error | null, data: string | undefined) => {
      if (err) resolve(text);
      resolve(data || text);
    });
  });
};
