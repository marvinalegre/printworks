import { Link, redirect, useFetcher, useLoaderData } from "react-router";
import type { Route } from "./+types/order";
import MultiFileUpload from "../components/multiple-file-upload";
import { useEffect, useState } from "react";
import classNames from "classnames";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("_action");

  if (actionType === "logout") {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    return redirect("/login");
  } else if (actionType === "upload") {
    const files = formData.getAll("files");
    const filenames = formData.get("filenames").split("|");
    const newFormData = new FormData();

    files.forEach((f) => {
      if (filenames.includes(f.name)) newFormData.append("files", f);
    });
    newFormData.set("orderRefNumber", formData.get("orderRefNumber"));

    await fetch("/api/files/upload", {
      method: "POST",
      body: newFormData,
    });
  } else if (actionType === "removeFile") {
    await fetch("/api/files/remove", {
      method: "delete",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: formData.get("filename"),
        orderRefNumber: formData.get("orderRefNumber"),
      }),
    });
    return null;
  }

  // TODO:  return failed uploads
  // TODO:  optimistic updates
  return null;
}

export async function clientLoader() {
  const res = await fetch("/api/order");

  if (res.status === 401) return redirect("/login");
  if (!res.ok) throw new Error("Something went wrong");

  return await res.json();
}

export default function Order({ loaderData }: Route.ComponentProps) {
  const { username, orderRefNumber, files } = loaderData;
  const logoutFetcher = useFetcher();
  const rmFileFetcher = useFetcher();
  const [currentFile, setCurrentFile] = useState(files[0]?.file_name || "");
  const [filesWithRanges, setFilesWithRanges] = useState(
    createFilesWithRanges(files),
  );

  let validTotalPrice = true;
  filesWithRanges.forEach((f) => {
    f.ranges.forEach((r) => {
      if (validTotalPrice) {
        validTotalPrice = validTotalPrice && r.validCopies;
        validTotalPrice = validTotalPrice && r.validRange;
      }
    });
  });

  let totalPrice = 0;
  filesWithRanges.forEach((f) => {
    totalPrice += calculateFilePrice(f);
  });

  function removeRange(filename, index) {
    const updatedFiles = JSON.parse(JSON.stringify(filesWithRanges));
    const fileIndex = updatedFiles.findIndex((f) => f.file_name === filename);
    updatedFiles[fileIndex].ranges.splice(index, 1);
    setFilesWithRanges(updatedFiles);
  }

  function addRange(filename) {
    const updatedFiles = JSON.parse(JSON.stringify(filesWithRanges));
    const fileIndex = updatedFiles.findIndex((f) => f.file_name === filename);
    updatedFiles[fileIndex].ranges.push({
      paperSize: updatedFiles[fileIndex].paper_size,
      color: "bw",
      range: `1-${updatedFiles[fileIndex].num_pages}`,
      copies: 1,
      validRange: true,
      validCopies: true,
    });
    setFilesWithRanges(updatedFiles);
  }

  function handleModeChange(filename, value) {
    const updatedFiles = JSON.parse(JSON.stringify(filesWithRanges));
    const fileIndex = updatedFiles.findIndex((f) => f.file_name === filename);
    updatedFiles[fileIndex].mode = value;
    setFilesWithRanges(updatedFiles);
  }

  function handleRangeChange(filename, rangeIndex, field, value, numPages) {
    const updatedFiles = JSON.parse(JSON.stringify(filesWithRanges));
    const fileIndex = updatedFiles.findIndex((f) => f.file_name === filename);

    updatedFiles[fileIndex].ranges[rangeIndex][field] = value;

    if (field === "copies") {
      if (!/^\d+$/.test(value) || value == 0) {
        updatedFiles[fileIndex].ranges[rangeIndex].validCopies = false;
      } else {
        updatedFiles[fileIndex].ranges[rangeIndex].validCopies = true;
      }
    }

    if (field === "range") {
      if (isValidRange(value, numPages)) {
        updatedFiles[fileIndex].ranges[rangeIndex].validRange = true;
      } else {
        updatedFiles[fileIndex].ranges[rangeIndex].validRange = false;
      }
    }

    setFilesWithRanges(updatedFiles);
  }

  useEffect(() => {
    if (files.length === 1 && !currentFile) {
      setCurrentFile(files[0].file_name);
    }
    if (
      files.length > 0 &&
      !files.map((f) => f.file_name).includes(currentFile)
    ) {
      setCurrentFile(files[0].file_name);
    }
    setFilesWithRanges(createFilesWithRanges(files));
  }, [files]);

  return (
    <>
      <nav className="flex justify-between items-center px-[5px] py-[10px] relative bg-sky-500 h-9 text-white md:rounded-tl md:rounded-tr">
        <Link to="/">
          <div className="font-semibold text-3xl italic">DKK</div>
        </Link>
        <ul className="flex space-x-8 ml-10 text-xl">
          {username ? (
            <li>
              <Link to={username} className="py-1 text-black">
                {username}
              </Link>
              {" | "}
              <logoutFetcher.Form
                method="post"
                className="py-1 text-black inline"
              >
                <input type="hidden" name="_action" value="logout" />
                <button className="cursor-pointer">log out</button>
              </logoutFetcher.Form>
            </li>
          ) : null}
        </ul>
      </nav>

      <MultiFileUpload orderRefNumber={orderRefNumber} uploadedFiles={files} />

      {files.length > 0 && (
        <div className="max-w-xl mx-auto my-20">
          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-2">
              Uploaded Files:
            </h2>
            <ul className="divide-y divide-gray-100 mb-4">
              {files.map((f, i) => (
                <li
                  key={i}
                  className={classNames({
                    "bg-gray-200": currentFile === f.file_name,
                    "flex items-center justify-between py-1 px-3": true,
                    "opacity-25 transition-opacity duration-200 delay-200":
                      rmFileFetcher.state === "submitting",
                  })}
                >
                  <button onClick={() => setCurrentFile(f.file_name)}>
                    <span className="text-gray-700 truncate w-64">
                      {f.file_name}
                    </span>
                  </button>
                  <rmFileFetcher.Form method="post">
                    <input type="hidden" name="_action" value="removeFile" />
                    <input type="hidden" name="filename" value={f.file_name} />
                    <input
                      type="hidden"
                      name="orderRefNumber"
                      value={orderRefNumber}
                    />
                    <button className="text-red-500 hover:underline">
                      Remove
                    </button>
                  </rmFileFetcher.Form>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <>
          <div className="max-w-xl mx-auto mt-20">
            <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <ul>
                {files.map((f, i) => (
                  <li
                    key={i}
                    className={classNames({
                      hidden: currentFile !== f.file_name,
                    })}
                  >
                    <p className="font-semibold text-xl bg-gray-200 p-2">
                      {f.file_name}
                    </p>
                    <p>number of pages: {f.num_pages}</p>
                    {f.full_color_pages && (
                      <p>full color pages: {f.full_color_pages}</p>
                    )}
                    {f.mid_color_pages && (
                      <p>mid color pages: {f.mid_color_pages}</p>
                    )}
                    {f.spot_color_pages && (
                      <p>spot color pages: {f.spot_color_pages}</p>
                    )}
                    <p>{}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="px-2">
            <div
              className={`${
                files.length ? "" : "hidden"
              } max-w-sm mx-auto md:mt-4 rounded-lg`}
            >
              {filesWithRanges.map((f) => (
                <div
                  key={f.file_name}
                  className={classNames({
                    "rounded-lg my-10": true,
                    hidden: f.file_name !== currentFile,
                  })}
                >
                  <div className="mb-4">
                    <label
                      htmlFor="pages"
                      className="block text-sm font-medium text-gray-600 mb-2"
                    >
                      Pages:
                    </label>
                    <select
                      defaultValue={f.mode}
                      onChange={(e) =>
                        handleModeChange(f.file_name, e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="all">All</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  {f.mode === "custom" ? (
                    <>
                      {f.ranges.map((pageRange, rowIndex) => (
                        <div
                          key={rowIndex}
                          className="mb-4 border shadow px-3 p-3 rounded bg-gray-100"
                        >
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                              Page range:
                            </label>
                            <input
                              autoComplete="off"
                              className={createRangeInputClass(pageRange)}
                              name="range"
                              onChange={(e) =>
                                handleRangeChange(
                                  f.file_name,
                                  rowIndex,
                                  "range",
                                  e.target.value,
                                  f.num_pages,
                                )
                              }
                              defaultValue={pageRange.range}
                            />
                          </div>

                          <div className="mb-4">
                            <label
                              htmlFor="copies"
                              className="block text-sm font-medium text-gray-600 mb-2"
                            >
                              Copies:
                            </label>
                            <input
                              type="number"
                              autoComplete="off"
                              className={createCopiesInputClass(pageRange)}
                              name="copies"
                              defaultValue={pageRange.copies}
                              onChange={(e) =>
                                handleRangeChange(
                                  f.file_name,
                                  rowIndex,
                                  "copies",
                                  e.target.value,
                                )
                              }
                            />
                          </div>

                          <div className="mb-4">
                            <label
                              htmlFor="color"
                              className="block text-sm font-medium text-gray-600 mb-2"
                            >
                              Color:
                            </label>

                            <select
                              name="color"
                              defaultValue={pageRange.color}
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              onChange={(e) =>
                                handleRangeChange(
                                  f.file_name,
                                  rowIndex,
                                  "color",
                                  e.target.value,
                                )
                              }
                            >
                              <option value="bw">black and white</option>
                              <option value="c">colored</option>
                            </select>
                          </div>

                          <div className="mb-4">
                            <label
                              htmlFor="page-size"
                              className="block text-sm font-medium text-gray-600 mb-2"
                            >
                              Page Size:
                            </label>

                            <select
                              name="paperSize"
                              defaultValue={pageRange.paperSize}
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              onChange={(e) =>
                                handleRangeChange(
                                  f.file_name,
                                  rowIndex,
                                  "paperSize",
                                  e.target.value,
                                )
                              }
                            >
                              <option value="s">short</option>
                              <option value="l">long</option>
                              <option value="a">A4</option>
                            </select>
                          </div>

                          {f.ranges.length > 1 && (
                            <button
                              type="button"
                              className="rounded bg-black px-5 py-1 text-lg font-medium text-white hover:bg-gray-600 text-center"
                              onClick={(e) =>
                                removeRange(f.file_name, rowIndex)
                              }
                            >
                              remove page range
                            </button>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="mb-4 border shadow px-3 pt-3 rounded bg-gray-100">
                      <div className="mb-4">
                        <label
                          htmlFor="copies"
                          className="block text-sm font-medium text-gray-600 mb-2"
                        >
                          Copies:
                        </label>
                        <input
                          type="number"
                          autoComplete="off"
                          className={createCopiesInputClass(f.ranges[0])}
                          name="copies"
                          defaultValue={f.ranges[0].copies}
                          onChange={(e) =>
                            handleRangeChange(
                              f.file_name,
                              0,
                              "copies",
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="mb-4">
                        <label
                          htmlFor="color"
                          className="block text-sm font-medium text-gray-600 mb-2"
                        >
                          Color:
                        </label>

                        <select
                          name="color"
                          defaultValue={f.ranges[0].color}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          onChange={(e) =>
                            handleRangeChange(
                              f.file_name,
                              0,
                              "color",
                              e.target.value,
                            )
                          }
                        >
                          <option value="bw">black and white</option>
                          <option value="c">colored</option>
                        </select>
                      </div>

                      <div className="mb-4">
                        <label
                          htmlFor="page-size"
                          className="block text-sm font-medium text-gray-600 mb-2"
                        >
                          Page Size:
                        </label>

                        <select
                          name="paperSize"
                          defaultValue={f.ranges[0].paperSize}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          onChange={(e) =>
                            handleRangeChange(
                              f.file_name,
                              0,
                              "paperSize",
                              e.target.value,
                            )
                          }
                        >
                          <option value="s">short</option>
                          <option value="l">long</option>
                          <option value="a">A4</option>
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="flex item-center justify-items">
                    {f.mode === "custom" ? (
                      <button
                        type="button"
                        className="rounded bg-sky-700 px-5 py-1 m-auto text-lg font-medium text-white hover:bg-sky-600 text-center"
                        onClick={(e) => addRange(f.file_name)}
                      >
                        add page range
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-xl mx-auto mt-2">
            <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <p>total price: {totalPrice}</p>
            </div>
          </div>
          <div className="flex justify-center items-center max-w-sm m-auto mt-14 mb-20">
            <button
              className={`${
                files.length ? "" : "hidden"
              } rounded bg-sky-500 px-4 py-2 text-xl font-medium text-white hover:bg-sky-600 w-full`}
              onClick={() => handlePlaceOrder(filesWithRanges, username)}
            >
              place order
            </button>
          </div>
        </>
      )}
    </>
  );
}

function createFilesWithRanges(files) {
  const sessionFilesWithRanges = sessionStorage.getItem("files");
  if (sessionFilesWithRanges == null) {
    return files.map((f) => {
      f.mode = "all";
      f.ranges = [
        {
          paperSize: f.paper_size,
          color: "bw",
          range: `1-${f.num_pages}`,
          copies: 1,
          validRange: true,
          validCopies: true,
        },
      ];
      return f;
    });
  } else {
    const filesWithRanges = JSON.parse(sessionStorage.getItem("files"));
    const frFilenames = filesWithRanges.map((f) => f.file_name);
    const output = [];
    for (let f of files) {
      if (frFilenames.includes(f.file_name)) {
        for (let fr of filesWithRanges) {
          if (fr.file_name === f.file_name) {
            output.push(fr);
            break;
          }
        }
      } else {
        f.mode = "all";
        f.ranges = [
          {
            paperSize: f.paper_size,
            color: "bw",
            range: `1-${f.num_pages}`,
            copies: 1,
            validRange: true,
            validCopies: true,
          },
        ];
        output.push(f);
      }
    }
    return output;
  }
}

const pricingData = {
  long: {
    fullColor: 13,
    midColor: 9,
    spotColor: 5,
    blackWhite: 3,
  },
  short: {
    fullColor: 10,
    midColor: 8,
    spotColor: 4,
    blackWhite: 2,
  },
  a4: {
    fullColor: 10,
    midColor: 8,
    spotColor: 4,
    blackWhite: 2,
  },
};
const colorAmounts = [
  "full_color_pages",
  "mid_color_pages",
  "spot_color_pages",
];

function calculateFilePrice(f) {
  let price = 0;
  if (f.mode === "all") {
    if (f.ranges[0].color === "c") {
      const arr = [];
      for (let ca of colorAmounts) {
        if (f[ca] != null) {
          arr.push(countMembersInRange(f[ca], `1-${f.num_pages}`));
        } else {
          arr.push(0);
        }
      }
      arr.push(f.num_pages - arr[0] - arr[1] - arr[2]);

      let temp = 0;
      temp +=
        arr[0] *
        pricingData[
          f.ranges[0].paperSize === "l"
            ? "long"
            : f.ranges[0].paperSize === "s"
              ? "short"
              : "a4"
        ].fullColor;
      temp +=
        arr[1] *
        pricingData[
          f.ranges[0].paperSize === "l"
            ? "long"
            : f.ranges[0].paperSize === "s"
              ? "short"
              : "a4"
        ].midColor;
      temp +=
        arr[2] *
        pricingData[
          f.ranges[0].paperSize === "l"
            ? "long"
            : f.ranges[0].paperSize === "s"
              ? "short"
              : "a4"
        ].spotColor;
      temp +=
        arr[3] *
        pricingData[
          f.ranges[0].paperSize === "l"
            ? "long"
            : f.ranges[0].paperSize === "s"
              ? "short"
              : "a4"
        ].blackWhite;

      price += temp * Number(f.ranges[0].copies);
    } else {
      price +=
        f.ranges[0].copies *
        f.num_pages *
        pricingData[
          f.ranges[0].paperSize === "l"
            ? "long"
            : f.ranges[0].paperSize === "s"
              ? "short"
              : "a4"
        ].blackWhite;
    }
  } else {
    for (let r of f.ranges) {
      if (r.color === "c") {
        const arr = [];
        for (let ca of colorAmounts) {
          if (f[ca] != null) {
            arr.push(countMembersInRange(f[ca], r.range));
          } else {
            arr.push(0);
          }
        }
        arr.push(f.num_pages - arr[0] - arr[1] - arr[2]);

        let temp = 0;
        temp +=
          arr[0] *
          pricingData[
            r.paperSize === "l" ? "long" : r.paperSize === "s" ? "short" : "a4"
          ].fullColor;
        temp +=
          arr[1] *
          pricingData[
            r.paperSize === "l" ? "long" : r.paperSize === "s" ? "short" : "a4"
          ].midColor;
        temp +=
          arr[2] *
          pricingData[
            r.paperSize === "l" ? "long" : r.paperSize === "s" ? "short" : "a4"
          ].spotColor;
        temp +=
          arr[3] *
          pricingData[
            r.paperSize === "l" ? "long" : r.paperSize === "s" ? "short" : "a4"
          ].blackWhite;

        price += temp * Number(r.copies);
      } else {
        price +=
          r.copies *
          f.num_pages *
          pricingData[
            r.paperSize === "l" ? "long" : r.paperSize === "s" ? "short" : "a4"
          ].blackWhite;
      }
    }
  }

  return price;
}

function parseRange(rangeString) {
  let numbers = [];

  // Split the string by commas to process individual parts
  let parts = rangeString.split(",");

  parts.forEach((part) => {
    if (part.includes("-")) {
      // If it's a range, expand it
      let [start, end] = part.split("-").map(Number);
      for (let i = start; i <= end; i++) {
        numbers.push(i);
      }
    } else {
      // Otherwise, it's a single number
      numbers.push(Number(part));
    }
  });

  return numbers;
}

function countMembersInRange(range1, range2) {
  // Parse both range1 and range2 into arrays of numbers
  const range1Numbers = parseRange(range1);
  const range2Numbers = parseRange(range2);

  // Create a Set from range1Numbers for fast lookup
  const range1Set = new Set(range1Numbers);

  // Count how many elements of range2 are in range1
  let count = 0;
  range2Numbers.forEach((num) => {
    if (range1Set.has(num)) {
      count++;
    }
  });

  return count;
}

function createCopiesInputClass(range) {
  return classNames({
    "w-full p-2 border border-gray-300 rounded-md": true,
    "ring-2 ring-red-500 focus:outline-none focus:ring-2 focus:ring-red-500":
      !range.validCopies,
    "focus:outline-none focus:ring-2 focus:ring-blue-500": range.validCopies,
  });
}

function createRangeInputClass(range) {
  return classNames({
    "w-full p-2 border border-gray-300 rounded-md": true,
    "ring-2 ring-red-500 focus:outline-none focus:ring-2 focus:ring-red-500":
      !range.validRange,
    "focus:outline-none focus:ring-2 focus:ring-blue-500": range.validRange,
  });
}
