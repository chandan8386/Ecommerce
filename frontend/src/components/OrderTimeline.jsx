import { formatDateTime, STATUS_LABELS } from '../utils/format.js';
import { CheckIcon } from './ui/Icons.jsx';

const FLOW = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

export default function OrderTimeline({ order }) {
  const history = order.statusHistory || [];
  const at = (s) => history.filter((h) => h.status === s).pop()?.at;

  if (['cancelled', 'returned'].includes(order.status)) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        This order was <strong>{STATUS_LABELS[order.status].toLowerCase()}</strong> on {formatDateTime(at(order.status) || order.cancelledAt)}.
        {history.filter((h) => h.status === order.status).pop()?.note && <p className="mt-1 text-rose-600">{history.filter((h) => h.status === order.status).pop().note}</p>}
      </div>
    );
  }
  if (order.status === 'pending') {
    return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">We're waiting for payment to confirm this order.</div>;
  }

  const currentIdx = FLOW.indexOf(order.status);
  return (
    <ol className="relative grid gap-6 sm:grid-cols-5 sm:gap-2">
      {FLOW.map((s, i) => {
        const done = i <= currentIdx;
        return (
          <li key={s} className="flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
            <div className="relative flex w-full items-center sm:justify-center">
              {i > 0 && <span className={`absolute right-1/2 top-1/2 hidden h-0.5 w-full -translate-y-1/2 sm:block ${i <= currentIdx ? 'bg-gold-500' : 'bg-stone-200'}`} />}
              <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${done ? 'border-gold-500 bg-gold-500 text-white' : 'border-stone-300 bg-white text-stone-300'}`}>
                <CheckIcon className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <div className="ml-3 sm:hidden">
                <p className={`text-sm font-medium ${done ? 'text-ink' : 'text-stone-400'}`}>{STATUS_LABELS[s]}</p>
                {at(s) && <p className="text-xs text-stone-500">{formatDateTime(at(s))}</p>}
              </div>
            </div>
            <div className="hidden sm:block">
              <p className={`text-xs font-medium ${done ? 'text-ink' : 'text-stone-400'}`}>{STATUS_LABELS[s]}</p>
              {at(s) && <p className="text-[11px] text-stone-500">{formatDateTime(at(s))}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
