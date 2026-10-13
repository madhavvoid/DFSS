import { isFolder } from "../utils/fileUtils";

function EntryIcon({ entry }) {
  if (isFolder(entry)) return <span className="entry-symbol folder-symbol" aria-hidden="true" />;
  const extension = entry.name.includes(".") ? entry.name.split(".").pop().slice(0, 3) : "FILE";
  return <span className="entry-symbol file-symbol" aria-hidden="true">{extension.toUpperCase()}</span>;
}

export default EntryIcon;