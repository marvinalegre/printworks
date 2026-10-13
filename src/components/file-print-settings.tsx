interface Props {
  filename: string;
  numPages: number;
  pageSize: string;
  fullColorRanges: string;
  midColorRanges: string;
  spotColorRanges: string;
  numFullColorPages: number;
  numMidColorPages: number;
  numSpotColorPages: number;
}

export const FilePrintSettings = ({
  filename,
  numPages,
  pageSize,
  fullColorRanges,
  midColorRanges,
  spotColorRanges,
  numFullColorPages,
  numMidColorPages,
  numSpotColorPages,
}: Props) => (
  <article className="print-settings">
    <div className="file-heading">
      <div className="file-icon" aria-hidden="true">
        PDF
      </div>

      <div className="file-heading-text">
        <span className="eyebrow">DOCUMENT DETAILS</span>
        <h2 className="file-name">{filename}</h2>
        <p className="file-meta">{numPages} pages · PDF document</p>
      </div>
    </div>

    <section className="settings-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">ANALYSIS</span>
          <h3>Color breakdown</h3>
        </div>

        <span className="page-total">{numPages} total pages</span>
      </div>

      <div className="color-breakdown">
        <div className="color-card full-color">
          <div className="color-card-top">
            <span className="color-dot" />
            <span>Full color</span>
          </div>
          <strong className="color-count">{numFullColorPages}</strong>
          <span className="color-unit">pages</span>
          <div className="range-value">{fullColorRanges || "No pages"}</div>
        </div>

        <div className="color-card mid-color">
          <div className="color-card-top">
            <span className="color-dot" />
            <span>Mid color</span>
          </div>
          <strong className="color-count">{numMidColorPages}</strong>
          <span className="color-unit">pages</span>
          <div className="range-value">{midColorRanges || "No pages"}</div>
        </div>

        <div className="color-card spot-color">
          <div className="color-card-top">
            <span className="color-dot" />
            <span>Spot color</span>
          </div>
          <strong className="color-count">{numSpotColorPages}</strong>
          <span className="color-unit">pages</span>
          <div className="range-value">{spotColorRanges || "No pages"}</div>
        </div>
      </div>
    </section>

    <section className="settings-section print-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CONFIGURATION</span>
          <h3>Print settings</h3>
        </div>
      </div>

      <form className="print-form">
        <label>
          Page size
          <select name="pageSize" defaultValue={pageSize}>
            <option value="A4">A4</option>
            <option value="A3">A3</option>
            <option value="Letter">Letter</option>
            <option value="Legal">Legal</option>
          </select>
        </label>

        <label>
          Copies
          <input
            type="number"
            name="copies"
            min={1}
            max={999}
            defaultValue={1}
            required
          />
        </label>

        <label>
          Color mode
          <select name="colorMode" defaultValue="color">
            <option value="color">Color</option>
            <option value="grayscale">Grayscale</option>
            <option value="black">Black and white</option>
          </select>
        </label>

        <label>
          Orientation
          <select name="orientation" defaultValue="portrait">
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>

        <label className="pages-field">
          Pages to print
          <input
            type="text"
            name="pages"
            placeholder="All pages (e.g. 1-5, 8)"
          />
          <small>Leave empty to print every page.</small>
        </label>
      </form>
    </section>
  </article>
);
