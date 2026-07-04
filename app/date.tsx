import { format } from "date-fns";
import { enGB } from "date-fns/locale";

export default function DateComponent({ dateString }: { dateString: string }) {
  return (
    <time dateTime={dateString}>
      {format(new Date(dateString), "d LLLL yyyy", { locale: enGB })}
    </time>
  );
}
