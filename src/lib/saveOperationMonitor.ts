import { debugLog } from '../client/utils/debugUtils';

/**
 * Save Operation Monitoring and Metrics Collection
 * 
 * Provides comprehensive tracking and monitoring of project save operations
 * for debugging, performance analysis, and reliability metrics.
 */

export interface SaveOperationMetrics {
  operationId: string;
  projectId: string;
  projectType: 'hotspot' | 'slide';
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'started' | 'validating' | 'saving' | 'completed' | 'failed';
  attempts: number;
  dataSize: {
    hotspotCount: number;
    eventCount: number;
    slideCount?: number;
    elementCount?: number;
  };
  validationResults?: {
    hasErrors: boolean;
    errorCount: number;
    warningCount: number;
  };
  transactionDetails?: {
    upsertOperations: number;
    deleteOperations: number;
    totalOperations: number;
  };
  errorDetails?: {
    errorType: string;
    errorCategory: string;
    errorMessage: string;
    retryable: boolean;
  };
  performanceMarkers: {
    validationTime?: number;
    transactionTime?: number;
    cleanupTime?: number;
  };
}

export interface SaveOperationSummary {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageDuration: number;
  successRate: number;
  errorCategories: Record<string, number>;
  performanceMetrics: {
    averageValidationTime: number;
    averageTransactionTime: number;
    averageCleanupTime: number;
  };
}

class SaveOperationMonitor {
  private operations: Map<string, SaveOperationMetrics> = new Map();
  private maxOperationHistory = 1000; // Keep last 1000 operations
  private metricsCollectionEnabled = true;

  /**
   * Start monitoring a save operation
   */
  startOperation(operationId: string, projectId: string, projectType: 'hotspot' | 'slide'): SaveOperationMetrics {
    const metrics: SaveOperationMetrics = {
      operationId,
      projectId,
      projectType,
      startTime: Date.now(),
      status: 'started',
      attempts: 1,
      dataSize: {
        hotspotCount: 0,
        eventCount: 0,
        slideCount: 0,
        elementCount: 0
      },
      performanceMarkers: {}
    };

    this.operations.set(operationId, metrics);
    this.cleanupOldOperations();

    debugLog.log(`[SaveMonitor] Started operation ${operationId} for project ${projectId} (type: ${projectType})`);
    return metrics;
  }

  /**
   * Update operation status and metrics
   */
  updateOperation(operationId: string, updates: Partial<SaveOperationMetrics>): SaveOperationMetrics | null {
    const operation = this.operations.get(operationId);
    if (!operation) {
      debugLog.warn(`[SaveMonitor] Operation ${operationId} not found for update`);
      return null;
    }

    // Merge updates
    Object.assign(operation, updates);

    // Update duration if status changed to completed or failed
    if ((updates.status === 'completed' || updates.status === 'failed') && !operation.endTime) {
      operation.endTime = Date.now();
      operation.duration = operation.endTime - operation.startTime;
    }

    this.operations.set(operationId, operation);

    debugLog.log(`[SaveMonitor] Updated operation ${operationId}:`, {
      status: operation.status,
      duration: operation.duration,
      attempts: operation.attempts
    });

    return operation;
  }

  /**
   * Record validation results
   */
  recordValidation(operationId: string, errorCount: number, warningCount: number, validationTime: number): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    operation.status = 'validating';
    operation.validationResults = {
      hasErrors: errorCount > 0,
      errorCount,
      warningCount
    };
    operation.performanceMarkers.validationTime = validationTime;

    this.operations.set(operationId, operation);

    debugLog.log(`[SaveMonitor] Validation completed for operation ${operationId}:`, {
      errors: errorCount,
      warnings: warningCount,
      duration: validationTime
    });
  }

  /**
   * Record data size metrics
   */
  recordDataSize(operationId: string, dataSize: Partial<SaveOperationMetrics['dataSize']>): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    Object.assign(operation.dataSize, dataSize);
    this.operations.set(operationId, operation);

    debugLog.log(`[SaveMonitor] Data size recorded for operation ${operationId}:`, operation.dataSize);
  }

  /**
   * Record transaction details
   */
  recordTransaction(operationId: string, upsertOps: number, deleteOps: number, transactionTime: number): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    operation.status = 'saving';
    operation.transactionDetails = {
      upsertOperations: upsertOps,
      deleteOperations: deleteOps,
      totalOperations: upsertOps + deleteOps
    };
    operation.performanceMarkers.transactionTime = transactionTime;

    this.operations.set(operationId, operation);

    debugLog.log(`[SaveMonitor] Transaction completed for operation ${operationId}:`, {
      upserts: upsertOps,
      deletes: deleteOps,
      duration: transactionTime
    });
  }

  /**
   * Record operation completion
   */
  completeOperation(operationId: string): SaveOperationMetrics | null {
    const operation = this.updateOperation(operationId, { status: 'completed' });
    
    if (operation) {
      debugLog.log(`[SaveMonitor] Operation ${operationId} completed successfully:`, {
        projectId: operation.projectId,
        duration: operation.duration,
        attempts: operation.attempts,
        dataSize: operation.dataSize
      });
    }

    return operation;
  }

  /**
   * Record operation failure
   */
  failOperation(operationId: string, error: Error, errorType: string, retryable: boolean): SaveOperationMetrics | null {
    const operation = this.operations.get(operationId);
    if (!operation) return null;

    operation.status = 'failed';
    operation.errorDetails = {
      errorType,
      errorCategory: this.categorizeError(error),
      errorMessage: error.message,
      retryable
    };

    return this.updateOperation(operationId, operation);
  }

  /**
   * Increment attempt count for retry scenarios
   */
  incrementAttempts(operationId: string): void {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.attempts++;
      this.operations.set(operationId, operation);
      debugLog.log(`[SaveMonitor] Operation ${operationId} attempt ${operation.attempts}`);
    }
  }

  /**
   * Get operation metrics
   */
  getOperation(operationId: string): SaveOperationMetrics | null {
    return this.operations.get(operationId) || null;
  }

  /**
   * Get summary of all operations
   */
  getSummary(): SaveOperationSummary {
    const operations = Array.from(this.operations.values());
    const completed = operations.filter(op => op.status === 'completed');
    const failed = operations.filter(op => op.status === 'failed');

    const errorCategories: Record<string, number> = {};
    failed.forEach(op => {
      if (op.errorDetails?.errorCategory) {
        errorCategories[op.errorDetails.errorCategory] = (errorCategories[op.errorDetails.errorCategory] || 0) + 1;
      }
    });

    const validOperations = operations.filter(op => op.duration !== undefined);
    const averageDuration = validOperations.length > 0 
      ? validOperations.reduce((sum, op) => sum + (op.duration || 0), 0) / validOperations.length
      : 0;

    const validationTimes = operations
      .map(op => op.performanceMarkers.validationTime)
      .filter(time => time !== undefined) as number[];
    
    const transactionTimes = operations
      .map(op => op.performanceMarkers.transactionTime)
      .filter(time => time !== undefined) as number[];

    const cleanupTimes = operations
      .map(op => op.performanceMarkers.cleanupTime)
      .filter(time => time !== undefined) as number[];

    return {
      totalOperations: operations.length,
      successfulOperations: completed.length,
      failedOperations: failed.length,
      averageDuration,
      successRate: operations.length > 0 ? completed.length / operations.length : 0,
      errorCategories,
      performanceMetrics: {
        averageValidationTime: validationTimes.length > 0 
          ? validationTimes.reduce((sum, time) => sum + time, 0) / validationTimes.length
          : 0,
        averageTransactionTime: transactionTimes.length > 0
          ? transactionTimes.reduce((sum, time) => sum + time, 0) / transactionTimes.length
          : 0,
        averageCleanupTime: cleanupTimes.length > 0
          ? cleanupTimes.reduce((sum, time) => sum + time, 0) / cleanupTimes.length
          : 0
      }
    };
  }

  /**
   * Get recent failed operations for debugging
   */
  getRecentFailures(limit = 10): SaveOperationMetrics[] {
    return Array.from(this.operations.values())
      .filter(op => op.status === 'failed')
      .sort((a, b) => (b.endTime || b.startTime) - (a.endTime || a.startTime))
      .slice(0, limit);
  }

  /**
   * Get operations for a specific project
   */
  getProjectOperations(projectId: string): SaveOperationMetrics[] {
    return Array.from(this.operations.values())
      .filter(op => op.projectId === projectId)
      .sort((a, b) => b.startTime - a.startTime);
  }

  /**
   * Clear all operation history
   */
  clearHistory(): void {
    this.operations.clear();
    debugLog.log('[SaveMonitor] Operation history cleared');
  }

  /**
   * Export operation data for analysis
   */
  exportData(): SaveOperationMetrics[] {
    return Array.from(this.operations.values());
  }

  /**
   * Enable/disable metrics collection
   */
  setEnabled(enabled: boolean): void {
    this.metricsCollectionEnabled = enabled;
    debugLog.log(`[SaveMonitor] Metrics collection ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.metricsCollectionEnabled;
  }

  /**
   * Private helper to categorize errors
   */
  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permission';
    } else if (message.includes('network') || message.includes('connection')) {
      return 'network';
    } else if (message.includes('timeout')) {
      return 'timeout';
    } else if (message.includes('validation')) {
      return 'validation';
    } else if (message.includes('transaction')) {
      return 'transaction';
    } else if (message.includes('quota') || message.includes('limit')) {
      return 'quota';
    } else {
      return 'unknown';
    }
  }

  /**
   * Private helper to clean up old operations
   */
  private cleanupOldOperations(): void {
    if (this.operations.size <= this.maxOperationHistory) return;

    const operations = Array.from(this.operations.entries())
      .sort(([, a], [, b]) => b.startTime - a.startTime);
    
    // Keep only the most recent operations
    const toKeep = operations.slice(0, this.maxOperationHistory);
    this.operations.clear();
    
    toKeep.forEach(([id, operation]) => {
      this.operations.set(id, operation);
    });

    debugLog.log(`[SaveMonitor] Cleaned up old operations, keeping ${toKeep.length}`);
  }

  /**
   * Generate periodic health report
   */
  generateHealthReport(): string {
    const summary = this.getSummary();
    const recentFailures = this.getRecentFailures(5);
    
    let report = `\n=== Save Operation Health Report ===\n`;
    report += `Total Operations: ${summary.totalOperations}\n`;
    report += `Success Rate: ${(summary.successRate * 100).toFixed(2)}%\n`;
    report += `Average Duration: ${summary.averageDuration.toFixed(0)}ms\n`;
    report += `\nPerformance Metrics:\n`;
    report += `  Validation: ${summary.performanceMetrics.averageValidationTime.toFixed(0)}ms\n`;
    report += `  Transaction: ${summary.performanceMetrics.averageTransactionTime.toFixed(0)}ms\n`;
    report += `  Cleanup: ${summary.performanceMetrics.averageCleanupTime.toFixed(0)}ms\n`;
    
    if (Object.keys(summary.errorCategories).length > 0) {
      report += `\nError Categories:\n`;
      Object.entries(summary.errorCategories).forEach(([category, count]) => {
        report += `  ${category}: ${count}\n`;
      });
    }
    
    if (recentFailures.length > 0) {
      report += `\nRecent Failures:\n`;
      recentFailures.forEach(failure => {
        report += `  ${failure.operationId}: ${failure.errorDetails?.errorMessage || 'Unknown error'}\n`;
      });
    }
    
    report += `===================================\n`;
    return report;
  }
}

// Export singleton instance
export const saveOperationMonitor = new SaveOperationMonitor();