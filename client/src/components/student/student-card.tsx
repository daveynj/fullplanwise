import { Student } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookOpen, MoreVertical, Pencil, Trash2, User } from "lucide-react";

interface StudentCardProps {
  student: Student;
  onDelete: () => void;
}

export function StudentCard({ student, onDelete }: StudentCardProps) {
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  // Get background color based on CEFR level
  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      "A1": "bg-red-100 text-red-800",
      "A2": "bg-orange-100 text-orange-800",
      "B1": "bg-yellow-100 text-yellow-800",
      "B2": "bg-green-100 text-green-800",
      "C1": "bg-blue-100 text-blue-800",
      "C2": "bg-indigo-100 text-indigo-800"
    };
    return colors[level] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <Avatar className="h-12 w-12 mr-4">
              <AvatarFallback className="bg-primary text-white">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-nunito font-semibold text-lg">{student.name}</h3>
              <div className="flex items-center mt-1 text-sm text-gray-500">
                <Badge variant="outline" className={`mr-2 ${getLevelColor(student.cefrLevel)}`}>
                  CEFR {student.cefrLevel}
                </Badge>
                {student.email && (
                  <span className="truncate max-w-[180px]">{student.email}</span>
                )}
              </div>
            </div>
          </div>
          
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href={`/students/${student.id}`}>
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>
                </Link>
                <Link href={`/generate?studentId=${student.id}`}>
                  <DropdownMenuItem className="cursor-pointer">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Create Lesson
                  </DropdownMenuItem>
                </Link>
                <Link href={`/students/${student.id}/edit`}>
                  <DropdownMenuItem className="cursor-pointer">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                </Link>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="cursor-pointer text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the student "{student.name}" and their associated lessons. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        {student.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
            <p className="text-gray-600">{student.notes}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-gray-50 p-4 flex justify-between">
        <div className="text-sm text-gray-500">
          Added on {new Date(student.createdAt).toLocaleDateString()}
        </div>
        <Link href={`/students/${student.id}`}>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
