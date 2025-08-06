export function getRandomOrderNumber(): string {
  const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `ORDER${randomNum}`;
}