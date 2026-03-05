import { NextResponse } from "next/server";
import { listProjects, listTasks, getColumns } from "@/lib/kanban-db";

export const dynamic = "force-dynamic";

interface ProjectWithStats {
  id: string;
  name: string;
  description: string | null;
  missionAlignment: string | null;
  status: string;
  milestones: unknown[];
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  progress: number;
}

/**
 * GET /api/projects
 * Return all projects with task statistics
 */
export async function GET() {
  try {
    const projects = listProjects();
    const tasks = listTasks();
    const columns = getColumns();

    // Find the "done" column to calculate progress
    const doneColumn = columns.find(
      (col) => col.name.toLowerCase() === "done" || col.name.toLowerCase() === "completed"
    );

    // Calculate taskCount and progress for each project
    const projectsWithStats: ProjectWithStats[] = projects.map((project) => {
      const projectTasks = tasks.filter((task) => task.projectId === project.id);
      const taskCount = projectTasks.length;

      let progress = 0;
      if (taskCount > 0 && doneColumn) {
        const doneTasks = projectTasks.filter((task) => task.status === doneColumn.id);
        progress = Math.round((doneTasks.length / taskCount) * 100);
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        missionAlignment: project.missionAlignment,
        status: project.status,
        milestones: project.milestones,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        taskCount,
        progress,
      };
    });

    return NextResponse.json({ projects: projectsWithStats });
  } catch (error) {
    console.error("Failed to get projects:", error);
    return NextResponse.json(
      { error: "Failed to load projects" },
      { status: 500 }
    );
  }
}
