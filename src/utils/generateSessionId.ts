export const generateSessionId = (): string => {
  const timestamp = Date.now();  // Get the current timestamp
  const randomPart = Math.random().toString(36).substring(2, 15);  // Generate a random string

  return `${timestamp}-${randomPart}`;  // Combine them into a unique ID
}

// const sessionId = generateSessionId();
// console.log(sessionId);  // Example output: '1645573948921-8e7v7xg6hgn'
