import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/_core/hooks/useAuth";
import { fetchAllDestinations } from "@/lib/content";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MapPin, Plus } from "lucide-react";

interface DestinationSelectorProps {
  value: string;
  onChange: (destinationId: string) => void;
  onCreateNew?: () => void;
}

export default function DestinationSelector({
  value,
  onChange,
  onCreateNew,
}: DestinationSelectorProps) {
  const { isAuthenticated, user } = useAuth();

  const { data: destinations = [], isLoading } = useQuery({
    queryKey: ["admin", "destinations"],
    queryFn: fetchAllDestinations,
    enabled: isAuthenticated && user?.role === "admin",
  });

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <MapPin size={16} />
        Select Destination *
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue
            placeholder={
              isLoading ? "Loading destinations…" : "Choose a destination"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {destinations.map(dest => (
            <SelectItem key={dest.id} value={dest.id}>
              <span className="flex items-center gap-2">
                <span className="font-medium">{dest.city}</span>
                {dest.country && (
                  <span className="text-muted-foreground text-xs">
                    , {dest.country}
                  </span>
                )}
                <span className="text-muted-foreground text-xs ml-auto">
                  {dest.date.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </span>
            </SelectItem>
          ))}
          {destinations.length > 0 && <div className="h-px bg-border my-1" />}
          <SelectItem value="__new__">
            <span className="flex items-center gap-2 text-primary">
              <Plus size={14} />
              Create new destination…
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
      {value === "__new__" && onCreateNew && (
        <p className="text-xs text-muted-foreground">
          You'll be redirected to create a new destination first.
        </p>
      )}
    </div>
  );
}
