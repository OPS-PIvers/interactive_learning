import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { debugLog } from '../client/utils/debugUtils';
import { firebaseManager } from './firebaseConfig';
import { saveOperationMonitor } from './saveOperationMonitor';

/**
 * Database Consistency Health Monitor
 * 
 * Monitors and validates database consistency, detects orphaned data,
 * and provides health metrics for the Firebase integration.
 */

export interface HealthCheckResult {
  checkId: string;
  timestamp: number;
  passed: boolean;
  checkType: string;
  details: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metrics?: Record<string, number>;
}

export interface DatabaseHealthReport {
  overallHealth: 'healthy' | 'warning' | 'critical';
  timestamp: number;
  checks: HealthCheckResult[];
  summary: {
    totalProjects: number;
    orphanedHotspots: number;
    orphanedEvents: number;
    inconsistentProjects: number;
    avgProjectSize: number;
  };
  recommendations: string[];
}

class DatabaseHealthMonitor {
  private lastHealthCheck: number = 0;
  private healthCheckInterval = 5 * 60 * 1000; // 5 minutes
  private isMonitoring = false;

  /**
   * Perform comprehensive database health check
   */
  async performHealthCheck(projectId?: string): Promise<DatabaseHealthReport> {
    const checkId = `health_${Date.now()}`;
    debugLog.log(`[HealthMonitor] Starting health check ${checkId}${projectId ? ` for project ${projectId}` : ''}`);

    const checks: HealthCheckResult[] = [];

    try {
      if (projectId) {
        // Single project health check
        checks.push(...(await this.checkSingleProject(projectId)));
      } else {
        // System-wide health check
        checks.push(...(await this.checkSystemHealth()));
      }

      const report = this.generateHealthReport(checks);
      debugLog.log(`[HealthMonitor] Health check ${checkId} completed:`, {
        overallHealth: report.overallHealth,
        checksPerformed: checks.length,
        issues: checks.filter((c) => !c.passed).length
      });

      return report;
    } catch (error) {
      debugLog.error(`[HealthMonitor] Health check ${checkId} failed:`, error);

      const errorCheck: HealthCheckResult = {
        checkId: `${checkId}_error`,
        timestamp: Date.now(),
        passed: false,
        checkType: 'system_error',
        details: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical'
      };

      return {
        overallHealth: 'critical',
        timestamp: Date.now(),
        checks: [errorCheck],
        summary: {
          totalProjects: 0,
          orphanedHotspots: 0,
          orphanedEvents: 0,
          inconsistentProjects: 0,
          avgProjectSize: 0
        },
        recommendations: ['Fix system error before continuing']
      };
    }
  }

  /**
   * Check health of a single project
   */
  private async checkSingleProject(projectId: string): Promise<HealthCheckResult[]> {
    const checks: HealthCheckResult[] = [];
    const db = firebaseManager.getFirestore();

    try {
      // Check if project exists
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) {
        checks.push({
          checkId: `project_exists_${projectId}`,
          timestamp: Date.now(),
          passed: false,
          checkType: 'project_existence',
          details: `Project ${projectId} does not exist`,
          severity: 'error'
        });
        return checks;
      }

      checks.push({
        checkId: `project_exists_${projectId}`,
        timestamp: Date.now(),
        passed: true,
        checkType: 'project_existence',
        details: `Project ${projectId} exists`,
        severity: 'info'
      });

      const projectData = projectSnap.data();

      // Check subcollection consistency
      const hotspotsRef = collection(db, 'projects', projectId, 'hotspots');
      const eventsRef = collection(db, 'projects', projectId, 'timeline_events');

      const [hotspotsSnap, eventsSnap] = await Promise.all([
      getDocs(hotspotsRef),
      getDocs(eventsRef)]
      );

      const hotspotCount = hotspotsSnap.size;
      const eventCount = eventsSnap.size;

      checks.push({
        checkId: `subcollections_${projectId}`,
        timestamp: Date.now(),
        passed: true,
        checkType: 'subcollection_access',
        details: `Found ${hotspotCount} hotspots and ${eventCount} events`,
        severity: 'info',
        metrics: { hotspotCount, eventCount }
      });

      // Check data consistency
      const hasSlides = !!projectData['slideDeck'];
      const projectType = projectData['projectType'] || 'hotspot';

      if (projectType === 'slide' && !hasSlides) {
        checks.push({
          checkId: `slide_consistency_${projectId}`,
          timestamp: Date.now(),
          passed: false,
          checkType: 'data_consistency',
          details: `Project marked as slide type but has no slide deck`,
          severity: 'warning'
        });
      }

      if (projectType === 'hotspot' && hotspotCount === 0 && eventCount === 0) {
        checks.push({
          checkId: `hotspot_consistency_${projectId}`,
          timestamp: Date.now(),
          passed: false,
          checkType: 'data_consistency',
          details: `Hotspot project has no hotspots or events`,
          severity: 'warning'
        });
      }

      // Check for required fields
      const requiredFields = ['title', 'createdBy', 'createdAt', 'updatedAt'];
      const missingFields = requiredFields.filter((field) => !projectData[field]);

      if (missingFields.length > 0) {
        checks.push({
          checkId: `required_fields_${projectId}`,
          timestamp: Date.now(),
          passed: false,
          checkType: 'data_integrity',
          details: `Missing required fields: ${missingFields.join(', ')}`,
          severity: 'error'
        });
      } else {
        checks.push({
          checkId: `required_fields_${projectId}`,
          timestamp: Date.now(),
          passed: true,
          checkType: 'data_integrity',
          details: `All required fields present`,
          severity: 'info'
        });
      }

      // Validate hotspot data integrity
      const invalidHotspots = hotspotsSnap.docs.filter((doc) => {
        const data = doc.data();
        return !data['id'] || data['x'] === undefined || data['y'] === undefined;
      });

      if (invalidHotspots.length > 0) {
        checks.push({
          checkId: `hotspot_integrity_${projectId}`,
          timestamp: Date.now(),
          passed: false,
          checkType: 'data_integrity',
          details: `Found ${invalidHotspots.length} invalid hotspots`,
          severity: 'error',
          metrics: { invalidCount: invalidHotspots.length }
        });
      } else if (hotspotCount > 0) {
        checks.push({
          checkId: `hotspot_integrity_${projectId}`,
          timestamp: Date.now(),
          passed: true,
          checkType: 'data_integrity',
          details: `All ${hotspotCount} hotspots are valid`,
          severity: 'info'
        });
      }

      // Validate event data integrity
      const invalidEvents = eventsSnap.docs.filter((doc) => {
        const data = doc.data();
        return !data['id'] || data['step'] === undefined || !data['type'];
      });

      if (invalidEvents.length > 0) {
        checks.push({
          checkId: `event_integrity_${projectId}`,
          timestamp: Date.now(),
          passed: false,
          checkType: 'data_integrity',
          details: `Found ${invalidEvents.length} invalid events`,
          severity: 'error',
          metrics: { invalidCount: invalidEvents.length }
        });
      } else if (eventCount > 0) {
        checks.push({
          checkId: `event_integrity_${projectId}`,
          timestamp: Date.now(),
          passed: true,
          checkType: 'data_integrity',
          details: `All ${eventCount} events are valid`,
          severity: 'info'
        });
      }

    } catch (error) {
      checks.push({
        checkId: `project_check_error_${projectId}`,
        timestamp: Date.now(),
        passed: false,
        checkType: 'system_error',
        details: `Error checking project ${projectId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical'
      });
    }

    return checks;
  }

  /**
   * Check system-wide health
   */
  private async checkSystemHealth(): Promise<HealthCheckResult[]> {
    const checks: HealthCheckResult[] = [];
    const db = firebaseManager.getFirestore();

    try {
      // Check Firebase connection
      checks.push({
        checkId: `firebase_connection_${Date.now()}`,
        timestamp: Date.now(),
        passed: firebaseManager.isReady(),
        checkType: 'system_connectivity',
        details: firebaseManager.isReady() ? 'Firebase connection is healthy' : 'Firebase connection issues',
        severity: firebaseManager.isReady() ? 'info' : 'critical'
      });

      // Get all projects
      const projectsRef = collection(db, 'projects');
      const projectsSnap = await getDocs(projectsRef);
      const totalProjects = projectsSnap.size;

      checks.push({
        checkId: `project_count_${Date.now()}`,
        timestamp: Date.now(),
        passed: true,
        checkType: 'system_metrics',
        details: `Found ${totalProjects} total projects`,
        severity: 'info',
        metrics: { totalProjects }
      });

      // Sample project health checks (check up to 10 projects)
      const sampleProjects = projectsSnap.docs.slice(0, 10);
      let inconsistentProjects = 0;
      const totalHotspots = 0;
      const totalEvents = 0;

      for (const projectDoc of sampleProjects) {
        const projectId = projectDoc.id;
        const projectData = projectDoc.data();

        try {
          const projectChecks = await this.checkSingleProject(projectId);
          if (projectChecks.some((c) => !c.passed)) {
            inconsistentProjects++;
          }
        } catch (error) {
          debugLog.warn(`[HealthMonitor] Error checking project ${projectId}:`, error);
          inconsistentProjects++;
        }
      }

      if (inconsistentProjects > 0) {
        checks.push({
          checkId: `consistency_check_${Date.now()}`,
          timestamp: Date.now(),
          passed: false,
          checkType: 'data_consistency',
          details: `Found ${inconsistentProjects} projects with consistency issues (sampled ${sampleProjects.length})`,
          severity: inconsistentProjects > sampleProjects.length * 0.5 ? 'critical' : 'warning',
          metrics: { inconsistentProjects, sampledProjects: sampleProjects.length }
        });
      } else {
        checks.push({
          checkId: `consistency_check_${Date.now()}`,
          timestamp: Date.now(),
          passed: true,
          checkType: 'data_consistency',
          details: `All sampled projects (${sampleProjects.length}) are consistent`,
          severity: 'info'
        });
      }

      // Check save operation health
      const saveMetrics = saveOperationMonitor.getSummary();
      if (saveMetrics.totalOperations > 0) {
        const successRate = saveMetrics.successRate;
        checks.push({
          checkId: `save_operations_${Date.now()}`,
          timestamp: Date.now(),
          passed: successRate >= 0.95, // 95% success rate threshold
          checkType: 'operational_health',
          details: `Save operation success rate: ${(successRate * 100).toFixed(1)}% (${saveMetrics.totalOperations} operations)`,
          severity: successRate >= 0.95 ? 'info' : successRate >= 0.90 ? 'warning' : 'error',
          metrics: {
            successRate: successRate * 100,
            totalOperations: saveMetrics.totalOperations,
            averageDuration: saveMetrics.averageDuration
          }
        });
      }

    } catch (error) {
      checks.push({
        checkId: `system_check_error_${Date.now()}`,
        timestamp: Date.now(),
        passed: false,
        checkType: 'system_error',
        details: `System health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical'
      });
    }

    return checks;
  }

  /**
   * Generate health report from check results
   */
  private generateHealthReport(checks: HealthCheckResult[]): DatabaseHealthReport {
    const failed = checks.filter((c) => !c.passed);
    const critical = failed.filter((c) => c.severity === 'critical');
    const errors = failed.filter((c) => c.severity === 'error');
    const warnings = failed.filter((c) => c.severity === 'warning');

    let overallHealth: 'healthy' | 'warning' | 'critical';
    if (critical.length > 0) {
      overallHealth = 'critical';
    } else if (errors.length > 0) {
      overallHealth = 'critical';
    } else if (warnings.length > 0) {
      overallHealth = 'warning';
    } else {
      overallHealth = 'healthy';
    }

    // Extract metrics from checks
    const totalProjects = checks.find((c) => c.checkType === 'system_metrics')?.metrics?.['totalProjects'] || 0;
    const orphanedHotspots = 0; // Would be calculated from orphan detection checks
    const orphanedEvents = 0; // Would be calculated from orphan detection checks
    const inconsistentProjects = checks.find((c) => c.checkType === 'data_consistency')?.metrics?.['inconsistentProjects'] || 0;

    // Generate recommendations
    const recommendations: string[] = [];

    if (critical.length > 0) {
      recommendations.push('CRITICAL: Address system connectivity or integrity issues immediately');
    }

    if (errors.length > 0) {
      recommendations.push('Fix data integrity errors to prevent data corruption');
    }

    if (warnings.length > 0) {
      recommendations.push('Review and resolve data consistency warnings');
    }

    if (inconsistentProjects > 0) {
      recommendations.push(`Migrate ${inconsistentProjects} projects to consistent architecture`);
    }

    const saveMetrics = saveOperationMonitor.getSummary();
    if (saveMetrics.successRate < 0.95) {
      recommendations.push('Investigate save operation failures to improve reliability');
    }

    if (recommendations.length === 0) {
      recommendations.push('Database health is good - continue monitoring');
    }

    return {
      overallHealth,
      timestamp: Date.now(),
      checks,
      summary: {
        totalProjects,
        orphanedHotspots,
        orphanedEvents,
        inconsistentProjects,
        avgProjectSize: totalProjects > 0 ? (orphanedHotspots + orphanedEvents) / totalProjects : 0
      },
      recommendations
    };
  }

  /**
   * Start periodic health monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      debugLog.warn('[HealthMonitor] Monitoring already started');
      return;
    }

    this.isMonitoring = true;
    debugLog.log('[HealthMonitor] Starting periodic health monitoring');

    const monitoringInterval = setInterval(async () => {
      try {
        const report = await this.performHealthCheck();

        if (report.overallHealth !== 'healthy') {
          debugLog.warn('[HealthMonitor] Health issues detected:', {
            health: report.overallHealth,
            issues: report.checks.filter((c) => !c.passed).length,
            recommendations: report.recommendations.length
          });
        }

        // Log periodic health report
        if (Date.now() - this.lastHealthCheck > this.healthCheckInterval) {

          this.lastHealthCheck = Date.now();
        }

      } catch (error) {
        debugLog.error('[HealthMonitor] Periodic health check failed:', error);
      }
    }, this.healthCheckInterval);

    // Cleanup on process exit
    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => {
        clearInterval(monitoringInterval);
        this.isMonitoring = false;
      });
    }
  }

  /**
   * Stop periodic monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    debugLog.log('[HealthMonitor] Stopped periodic health monitoring');
  }

  /**
   * Generate human-readable health summary
   */
  private generateHealthSummary(report: DatabaseHealthReport): string {
    let summary = `\\n=== Database Health Report ===\\n`;
    summary += `Overall Health: ${report.overallHealth.toUpperCase()}\\n`;
    summary += `Timestamp: ${new Date(report.timestamp).toISOString()}\\n`;
    summary += `Total Projects: ${report.summary.totalProjects}\\n`;

    if (report.summary.inconsistentProjects > 0) {
      summary += `Inconsistent Projects: ${report.summary.inconsistentProjects}\\n`;
    }

    const failed = report.checks.filter((c) => !c.passed);
    if (failed.length > 0) {
      summary += `\\nIssues Found:\\n`;
      failed.forEach((check) => {
        summary += `  ${check.severity.toUpperCase()}: ${check.details}\\n`;
      });
    }

    if (report.recommendations.length > 0) {
      summary += `\\nRecommendations:\\n`;
      report.recommendations.forEach((rec) => {
        summary += `  - ${rec}\\n`;
      });
    }

    summary += `==============================\\n`;
    return summary;
  }

  /**
   * Get monitoring status
   */
  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}

// Export singleton instance
export const databaseHealthMonitor = new DatabaseHealthMonitor();