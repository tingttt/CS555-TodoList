const exportedMethods = {
  checkDescription(strVal) {
    if (!strVal) throw new Error(`You must supply a Description!`);
    if (typeof strVal !== "string")
      throw new Error(`Description must be a string!`);
    strVal = strVal.trim();
    if (strVal.length === 0)
      throw new Error(
        `Description cannot be an empty string or string with just spaces`
      );
    // if (!isNaN(strVal))
    //   throw new Error(`${strVal} is not a valid value for ${varName} as it only contains digits`);
    if (strVal.length < 25)
      throw new Error(
        `${strVal} should be at least 25 characters long, now is only ${strVal.length} long.`
      );
    return strVal;
  },

  checkTitle(strVal) {
    if (!strVal) throw new Error(`You must supply a Title!`);
    if (typeof strVal !== "string") throw new Error(`Title must be a string!`);
    strVal = strVal.trim();
    if (strVal.length === 0)
      throw new Error(
        `Title cannot be an empty string or string with just spaces`
      );
    // if (!isNaN(strVal))
    //   throw new Error(`${strVal} is not a valid value for Title as it only contains digits`);
    if (strVal.length < 5)
      throw new Error(
        `${strVal} should be at least 5 characters long, now is only ${strVal.length} long`
      );
    // if(!/^[a-zA-Z\s\-'.]+$/.test(strVal))
    //    throw new Error(`${strVal} has other characters from allowed (hyphens, apostrophe, period) and space`);
    return strVal;
  },
  getCurrentDateString() {
    const today = new Date();
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    const formattedDate = today.toLocaleDateString("en-US", options);
    return formattedDate;
  },
checkDate(date, varDate) {
  if (!date || typeof date !== "string") {
    throw new Error(`You must supply a ${varDate}!`);
  }
  
  const trimmedDate = date.trim();
  
  // Updated Regex: Allows 1 or 2 digits for month/day
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = trimmedDate.match(dateRegex);

  if (!match) {
    throw new Error(`${varDate} must be in M/D/YYYY or MM/DD/YYYY format`);
  }

  // Use parseInt to turn "3" or "03" into the number 3
  const mm = parseInt(match[1], 10);
  const dd = parseInt(match[2], 10);
  const yyyy = parseInt(match[3], 10);

  // 1. Basic Range Checks
  if (mm < 1 || mm > 12) throw new Error(`${varDate} month must be 01-12`);
  if (yyyy < 1900 || yyyy > 2100) throw new Error(`${varDate} year is out of range`);

  // 2. The JS Date Validation Trick
  const ndate = new Date(yyyy, mm - 1, dd);

  // Check if JS "rolled over" the date (e.g., Feb 30 becomes March 2)
  if (
    ndate.getFullYear() !== yyyy ||
    ndate.getMonth() !== mm - 1 ||
    ndate.getDate() !== dd
  ) {
    throw new Error(`${varDate} is not a valid calendar date (e.g., Feb 30th)`);
  }

  return trimmedDate;
}
};

export default exportedMethods;
