export const FileUploader = () => (
  <article id="file-uploader">
    <header>
      <strong>Upload a file</strong>
    </header>

    <form id="uploadForm">
      <label for="fileInput">
        Choose file
        <input
          type="file"
          id="fileInput"
          name="file"
          accept="application/pdf,.pdf"
        />
      </label>

      <button type="submit" id="upload">
        Upload
      </button>
    </form>

    <progress id="progress" value="0" max="100" hidden></progress>
    <p id="status"></p>
  </article>
);
