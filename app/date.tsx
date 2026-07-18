import { format } from "date-fns";
import { enGB } from "date-fns/locale";

export default function DateComponent({
  dateString,
  formatString = "d LLLL yyyy",
}: {
  dateString: string;
  // date-fns format token string. Default is the sitewide long form. The
  // archive passes "d MMM" because the year already lives in the section
  // heading, so repeating it per row is noise.
  formatString?: string;
}) {
  return (
    <time dateTime={dateString}>
      {format(new Date(dateString), formatString, { locale: enGB })}
    </time>
  );
}
