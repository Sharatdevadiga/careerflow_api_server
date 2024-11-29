function formatDate(date) {
  const d = new Date(date);
  let day = d.getDate();
  let month = d.getMonth() + 1; // Months are zero-based
  const year = d.getFullYear();

  if (day < 10) {
    day = "0" + day;
  }
  if (month < 10) {
    month = "0" + month;
  }

  return `${day}/${month}/${year}`;
}

export default formatDate;
