import { useFetcher } from "react-router";
import classNames from "classnames";

export default function UploadedFiles({
  orderRefNumber,
  files,
  currentFile,
  setCurrentFile,
}) {
  const fetcher = useFetcher();

  return (
    <div className="max-w-xl mx-auto my-20">
      <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-2">Uploaded Files:</h2>
        <ul className="divide-y divide-gray-100 mb-4">
          {files.map((f, i) => (
            <li
              key={i}
              className={classNames({
                "bg-gray-200": currentFile === f.file_name,
                "flex items-center justify-between py-1 px-3": true,
                "opacity-25 transition-opacity duration-200 delay-200":
                  fetcher.state === "submitting",
              })}
            >
              <button onClick={() => setCurrentFile(f.file_name)}>
                <span className="text-gray-700 truncate w-64">
                  {f.file_name}
                </span>
              </button>
              <fetcher.Form method="post">
                <input type="hidden" name="_action" value="removeFile" />
                <input type="hidden" name="filename" value={f.file_name} />
                <input
                  type="hidden"
                  name="orderRefNumber"
                  value={orderRefNumber}
                />
                <button className="text-red-500 hover:underline">Remove</button>
              </fetcher.Form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
