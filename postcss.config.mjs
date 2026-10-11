// Tailwind only reaches pages that import src/styles/quiz.css, so its
// base reset never touches the blog.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
