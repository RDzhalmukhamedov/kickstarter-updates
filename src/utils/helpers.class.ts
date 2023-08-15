import { ProjectStatus } from './project-status.enum.js';

export class Helpers {
    public static statusToString(status: ProjectStatus): string {
        return ProjectStatus[status];
    }

    public static parseStatusFromKs(status: string | undefined): ProjectStatus {
        switch (status) {
            case 'live':
                return ProjectStatus.Live;
            case 'successful':
                return ProjectStatus.Completed;
            case 'canceled':
                return ProjectStatus.Canceled;
            case 'submitted':
                return ProjectStatus.Draft;
            default:
                return ProjectStatus.NotTracked;
        }
    }
}
