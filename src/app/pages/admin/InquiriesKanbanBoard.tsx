import { motion } from "motion/react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Inquiry } from "../../data/supabaseData";
import { Clock, CheckCircle2, ArrowUpDown, Calendar, Mail, User, AlertCircle, Phone, MapPin } from "lucide-react";

interface KanbanBoardProps {
  inquiries: Inquiry[];
  onStatusChange: (id: string, newStatus: "new" | "in_progress" | "closed") => Promise<void>;
  onInquiryClick: (id: string) => void;
}

const ItemTypes = {
  INQUIRY: "inquiry",
};

const KanbanColumn = ({
  status,
  title,
  icon: Icon,
  colorClass,
  bgClass,
  inquiries,
  onDrop,
  onClick,
}: {
  status: "new" | "in_progress" | "closed";
  title: string;
  icon: any;
  colorClass: string;
  bgClass: string;
  inquiries: Inquiry[];
  onDrop: (id: string, newStatus: "new" | "in_progress" | "closed") => void;
  onClick: (id: string) => void;
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.INQUIRY,
    drop: (item: { id: string }) => onDrop(item.id, status),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [status, onDrop]);

  return (
    <div
      ref={(node) => { drop(node); }}
      className={`flex flex-col rounded-3xl border border-border p-4 transition-colors ${
        isOver ? "bg-muted/80 ring-2 ring-accent/30" : "bg-muted/30"
      }`}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${colorClass}`} />
          <h3 className="font-bold uppercase tracking-widest text-xs">{title}</h3>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${bgClass} ${colorClass}`}>
          {inquiries.length}
        </div>
      </div>
      
      <div className="flex-1 space-y-3 min-h-[500px]">
        {inquiries.map((inq) => (
          <KanbanCard key={inq.id} inquiry={inq} onClick={() => onClick(inq.id)} colorClass={colorClass} />
        ))}
        {inquiries.length === 0 && (
          <div className="h-full flex items-center justify-center text-muted-foreground/50 text-sm font-medium border-2 border-dashed border-border rounded-2xl p-8 text-center">
            Drop leads here
          </div>
        )}
      </div>
    </div>
  );
};

const KanbanCard = ({ inquiry, onClick, colorClass }: { inquiry: Inquiry; onClick: () => void; colorClass: string }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.INQUIRY,
    item: { id: inquiry.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <motion.div
      ref={(node) => { drag(node); }}
      layoutId={inquiry.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className={`p-4 bg-background border border-border rounded-2xl shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group ${
        isDragging ? "opacity-50 scale-95" : "opacity-100"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">{inquiry.name}</h4>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <Mail className="w-3 h-3" />
            <span className="line-clamp-1">{inquiry.email}</span>
          </div>
        </div>
        {inquiry.isSpam && (
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
        )}
      </div>

      {inquiry.trek && (
        <div className="px-2 py-1 bg-muted rounded-md text-xs font-medium text-foreground mb-3 line-clamp-1 border border-border/50">
          {inquiry.trek}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
          <Calendar className="w-3 h-3" />
          {new Date(inquiry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
        <div className={`w-2 h-2 rounded-full ${colorClass.replace('text-', 'bg-')}`} />
      </div>
    </motion.div>
  );
};

export function InquiriesKanbanBoard({ inquiries, onStatusChange, onInquiryClick }: KanbanBoardProps) {
  const newInquiries = inquiries.filter((i) => i.status === "new" && !i.isSpam);
  const inProgressInquiries = inquiries.filter((i) => i.status === "in_progress" && !i.isSpam);
  const closedInquiries = inquiries.filter((i) => i.status === "closed" && !i.isSpam);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KanbanColumn
          status="new"
          title="New Leads"
          icon={Clock}
          colorClass="text-blue-500"
          bgClass="bg-blue-500/10"
          inquiries={newInquiries}
          onDrop={onStatusChange}
          onClick={onInquiryClick}
        />
        <KanbanColumn
          status="in_progress"
          title="In Progress"
          icon={ArrowUpDown}
          colorClass="text-amber-500"
          bgClass="bg-amber-500/10"
          inquiries={inProgressInquiries}
          onDrop={onStatusChange}
          onClick={onInquiryClick}
        />
        <KanbanColumn
          status="closed"
          title="Closed / Booked"
          icon={CheckCircle2}
          colorClass="text-emerald-500"
          bgClass="bg-emerald-500/10"
          inquiries={closedInquiries}
          onDrop={onStatusChange}
          onClick={onInquiryClick}
        />
      </div>
    </DndProvider>
  );
}
