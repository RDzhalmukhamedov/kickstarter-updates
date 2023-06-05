import { ProjectStatus } from './project-status.enum.js';

export interface ProjectInfo {
    ProjectId: number;
    ProjectName: string;
    Link: string;
    Status: ProjectStatus;
    PrevStatus: ProjectStatus;
    LastUpdateId: number | null;
    LastUpdateTitle: string | null;
    UpdatesCount: number;
    PrevUpdatesCount: number;
}
