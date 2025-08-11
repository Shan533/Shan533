# Profile README SVG

This project generates a dynamic SVG that displays my profile information, including GitHub stats, social links, and current weather. It's designed to be embedded in my GitHub profile `README.md`.

## Design and Key Parts

The project is built around a few core components:

*   **`template.svg`**: This is the master template for the SVG image. It uses placeholders (like `{...}`) that are dynamically replaced with real data.
*   **`chat.svg`**: This is the generated SVG file that is displayed on my profile. It's created by the build process.
*   **`build-svg.js`**: A Node.js script that reads the `template.svg`, replaces the placeholders with the latest data (from API calls or static configs), and writes the final output to `chat.svg`.
*   **GitHub Actions**: A workflow (`.github/workflows/build-chat.yml`) runs on a schedule (e.g., every 30 minutes) to execute the `build-svg.js` script, ensuring the `chat.svg` is always up-to-date. It then commits the updated SVG back to the repository.

## Credits

This project is heavily inspired by the work of **Jason Long** and his project **isometric-contributions**. Many of the design ideas and the concept of a dynamic, generative SVG for a GitHub profile come from his original work.

A huge thank you to Jason for the inspiration!

-   **Jason Long's GitHub Profile**: [https://github.com/jasonlong](https://github.com/jasonlong)
-   **Original Project**: [isometric-contributions](https://github.com/jasonlong/jasonlong)