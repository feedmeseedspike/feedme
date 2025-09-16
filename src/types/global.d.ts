/**
 *
 * Define all global types in this file.
 *
 */

type User = {
  email: string;
  image: string;
  username: string;
};

type Todo = {
  _id: string;
  todoTitle: string;
  todoDescription: string;
  isComplete: boolean;
  creator: User;
};

declare module 'react-quill/dist/quill.snow.css';