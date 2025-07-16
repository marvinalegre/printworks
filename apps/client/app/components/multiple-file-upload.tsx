import React, { useState } from "react";
import CryptoJS from "crypto-js";
import classNames from "classnames";
import { useFetcher } from "react-router";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function MultiFileUpload({ orderRefNumber, uploadedFiles }) {
  // TODO:  make sure the filenames dont have a pipe (|) in them
  const [filenames, setFilenames] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const fetcher = useFetcher();
  const uploadedFileMD5s = uploadedFiles.map((f) => f.md5_hash);

  async function filterFiles(selectedFiles) {
    const validFiles = [];
    const rejectedFiles = [];

    selectedFiles.forEach((file) => {
      const isPDF = file.type === "application/pdf";
      const isSmallEnough = file.size <= MAX_FILE_SIZE_BYTES;

      if (isPDF && isSmallEnough) {
        validFiles.push(file);
      } else {
        let reason = "";
        if (!isPDF) reason = "not a PDF";
        else if (!isSmallEnough) reason = "exceeds 5MB";
        rejectedFiles.push(`${file.name} (${reason})`);
      }
    });

    const validFileMD5s = await Promise.all(validFiles.map(getFileHash));
    const rejectedFileIndices = [];
    const filteredFiles = validFiles.filter((f, i) => {
      const j = uploadedFileMD5s.indexOf(validFileMD5s[i]);
      if (j >= 0) {
        rejectedFileIndices.push(i);
        rejectedFiles.push(
          `${f.name} (already uploaded as ${uploadedFiles[j].file_name})`,
        );
        return false;
      } else {
        return true;
      }
    });

    if (rejectedFiles.length > 0) {
      setError(
        `❌ The following files were rejected:\n${rejectedFiles.join(", ")}`,
      );
    } else {
      setError(null);
    }

    setFilenames(filteredFiles.map((f) => f.name).join("|"));
    return filteredFiles;
  }

  async function handleFileChange(e) {
    const selectedFiles = Array.from(e.target.files);
    const filteredFiles = await filterFiles(selectedFiles, files.length);
    setFiles(() => [...filteredFiles]);
  }

  // TODO:  test this feature
  async function handleDrop(e) {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const filteredFiles = await filterFiles(droppedFiles, files.length);
    setFiles((prev) => [...prev, ...filteredFiles]);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleUpload(e) {
    e.preventDefault();
    setFiles([]);
    setError(null);
    fetcher.submit(e.target);
  }

  return (
    <div
      className={classNames({
        "max-w-xl mx-auto my-20": true,
        "opacity-25 transition-opacity duration-200 delay-200":
          fetcher.state === "submitting",
      })}
    >
      <fetcher.Form method="post" encType="multipart/form-data">
        <input type="hidden" name="_action" value="upload" />
        <input
          type="hidden"
          name="orderRefNumber"
          defaultValue={orderRefNumber}
        />
        <input type="hidden" name="filenames" defaultValue={filenames} />

        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 mb-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 16v-8m0 0l-3 3m3-3l3 3M6 20h12a2 2 0 002-2V7a2 2 0 00-.586-1.414l-4-4A2 2 0 0014 1H6a2 2 0 00-2 2v15a2 2 0 002 2z"
              />
            </svg>
            <p className="mb-2 text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-gray-500">
              <span className="font-semibold">PDF</span> files under{" "}
              <span className="font-semibold">5MB</span>.
            </p>
          </div>
          <input
            type="file"
            name="files"
            multiple
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {error && (
          <div className="mt-4 text-red-600 bg-red-50 border border-red-200 p-3 rounded whitespace-pre-wrap">
            {error}
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-2">
              Selected Files:
            </h2>
            <ul className="divide-y divide-gray-100 mb-4">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between py-1 px-3"
                >
                  <span className="text-gray-700 truncate w-64">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  <button className="text-red-500 hover:underline">
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-blue-300"
              onClick={handleUpload}
            >
              Upload Files
            </button>
          </div>
        )}
      </fetcher.Form>
    </div>
  );
}

async function getFileHash(file) {
  const arrayBuffer = await file.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
  const md5Hash = CryptoJS.MD5(wordArray).toString();
  return md5Hash;
}

function removeByIndices(array, indices) {
  // Create a Set for faster lookups
  const indicesToRemove = new Set(indices);

  // Filter out elements whose index is in the Set
  return array.filter((_, i) => !indicesToRemove.has(i));
}
