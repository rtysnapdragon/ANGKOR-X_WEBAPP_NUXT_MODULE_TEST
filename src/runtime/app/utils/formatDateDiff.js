export default (
  d,
  format = {
    date: true,
    time: true,
  }
) => {
  const date = format.date ?? false;
  const time = format.time ?? false;

  let result = "";
  if (isNotEmpty(d)) {
    const [year, month, day, hour, minute, second] = d.split(",").map(Number);
    if (year > 0 && date)
      result += `${year} ${tBy({ km: "ឆ្នាំ", en: `year${s(year)}` })} `;
    if (month > 0 && date)
      result += `${month} ${tBy({ km: "ខែ", en: `month${s(month)}` })} `;
    if (day > 0 && date)
      result += `${day} ${tBy({ km: "ថ្ងៃ", en: `day${s(day)}` })} `;
    if (hour > 0 && time)
      result += `${hour} ${tBy({ km: "ម៉ោង", en: `hour${s(hour)}` })} `;
    if (minute > 0 && time)
      result += `${minute} ${tBy({ km: "នាទី", en: `minute${s(minute)}` })}, `;
    if (second > 0 && time)
      result += `${second} ${tBy({ km: "វិនាទី", en: `second${s(second)}` })} `;
  }

  return result.trim();
};

function s(v) {
  return v > 1 ? "s" : "";
}

// d is a string which form number of 'year,month,day,hour,minute,second' or '2,5,28,0,0,0' will result 2 years 5 months 28 days **note** if 0 it'll ignore
// format is the need date or time to display
