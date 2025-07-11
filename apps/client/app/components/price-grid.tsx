import React from "react";

// Define the pricing data
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

// Define the paper sizes and color types
const paperSizes = ["long", "short", "a4"];
const colorTypes = ["fullColor", "midColor", "spotColor", "blackWhite"]; // Added "blackWhite"

const PriceGrid = () => {
  // Function to handle the "Start Order" button click
  const handleStartOrder = () => {
    alert("Order process started!"); // Replace with actual logic, e.g., redirect or open a modal.
  };

  return (
    <div className="mt-10 mx-auto max-w-xl px-4 py-8">
      <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
        Prices
      </h2>

      {/* Table to display price grid */}
      <table className="min-w-full table-auto border-collapse border border-gray-200 shadow-md">
        <thead>
          <tr className="bg-gray-100 text-left text-sm font-medium text-gray-700">
            <th className="px-4 py-2 border-b"></th>
            {paperSizes.map((size, index) => (
              <th key={index} className="text-center px-4 py-2 border-b">
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {colorTypes.map((color, rowIndex) => (
            <tr
              key={rowIndex}
              className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              <td className="px-4 py-2 border-b text-gray-800">
                {color.replace(/([A-Z])/g, " $1")}
              </td>
              {paperSizes.map((size, colIndex) => {
                const price = pricingData[size][color];
                return (
                  <td
                    key={colIndex}
                    className="px-4 py-2 border-b text-center text-gray-800"
                  >
                    Php {price.toFixed(2)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PriceGrid;
