import { ProjectStatus } from './project-status.enum.js';

export interface ProjectInfo {
    projectId: number;
    projectName: string;
    link: string;
    status: ProjectStatus;
    prevStatus: ProjectStatus;
    lastUpdateId: number | null;
    lastUpdateTitle: string | null;
    updatesCount: number;
    prevUpdatesCount: number;
}
