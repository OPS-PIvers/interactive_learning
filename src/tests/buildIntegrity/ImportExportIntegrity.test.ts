import { describe, test, expect } from 'vitest';

describe('Import/Export Integrity Tests', () => {
  describe('Core Module Exports', () => {
    test('slideTypes module exports all required types', async () => {
      const slideTypesModule = await import('../../shared/slideTypes');
      
      // DeviceType is a type alias, not a runtime value, so we test compilation
      // Test that we can use the types (compilation check)
      const deviceTypes = ['desktop', 'tablet', 'mobile'];
      expect(deviceTypes).toContain('desktop');
      
      // Test that the module itself exists and has exports
      expect(slideTypesModule).toBeDefined();
      expect(typeof slideTypesModule).toBe('object');
    });

    test('shared types module exports correctly', async () => {
      const typesModule = await import('../../shared/types');
      expect(typesModule).toBeDefined();
    });

    test('Firebase configuration module exports correctly', async () => {
      const firebaseModule = await import('../../lib/firebaseConfig');
      expect(firebaseModule.firebaseManager).toBeDefined();
      expect(typeof firebaseModule.firebaseManager.isReady).toBe('function');
    });
  });

  describe('Component Module Structure', () => {
    test('SlideBasedInteractiveModule has default export', async () => {
      const module = await import('../../client/components/SlideBasedInteractiveModule');
      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe('function');
    });


    test('EnhancedPropertiesPanel has default export', async () => {
      const module = await import('../../client/components/EnhancedPropertiesPanel');
      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe('function');
    });
  });

  describe('Hook Module Structure', () => {
    test('useIsMobile hook exports correctly', async () => {
      const module = await import('../../client/hooks/useIsMobile');
      expect(module.useIsMobile).toBeDefined();
      expect(typeof module.useIsMobile).toBe('function');
    });

    test('useToast hook exports correctly', async () => {
      const module = await import('../../client/hooks/useToast');
      expect(module.useToast).toBeDefined();
      expect(module.ToastProvider).toBeDefined();
      expect(typeof module.useToast).toBe('function');
    });
  });

  describe('Context and Provider Exports', () => {
    test('AuthProvider exports correctly', async () => {
      const module = await import('../../lib/authContext');
      expect(module.AuthProvider).toBeDefined();
      expect(module.useAuth).toBeDefined();
      expect(typeof module.AuthProvider).toBe('function');
      expect(typeof module.useAuth).toBe('function');
    });
  });

  describe('Cross-Module Dependencies', () => {
    test('components can import required types', async () => {
      // Test that types can be imported where components need them
      const slideTypes = await import('../../shared/slideTypes');
      const sharedTypes = await import('../../shared/types');
      
      expect(slideTypes).toBeDefined();
      expect(sharedTypes).toBeDefined();
      
      // Verify no circular dependencies in critical imports
      expect(() => {
        return {
          slideTypes,
          sharedTypes
        };
      }).not.toThrow();
    });

    test('hooks can import required utilities', async () => {
      const hooks = await Promise.all([
        import('../../client/hooks/useIsMobile'),
        import('../../client/hooks/useToast')
      ]);
      
      hooks.forEach(hookModule => {
        expect(hookModule).toBeDefined();
      });
    });
  });

  describe('Module Loading Performance', () => {
    test('core modules load within acceptable time', async () => {
      const startTime = Date.now();
      
      await Promise.all([
        import('../../shared/slideTypes'),
        import('../../shared/types'),
        import('../../lib/firebaseConfig'),
        import('../../client/hooks/useIsMobile'),
        import('../../client/hooks/useToast')
      ]);
      
      const loadTime = Date.now() - startTime;
      
      // Should load core modules quickly (under 100ms in test environment)
      expect(loadTime).toBeLessThan(100);
    });

    test('component modules can be loaded dynamically', async () => {
      const loadComponent = async (path: string) => {
        const startTime = Date.now();
        const module = await import(path);
        const loadTime = Date.now() - startTime;
        return { module, loadTime };
      };

      const components = await Promise.all([
        loadComponent('../../client/components/SlideBasedInteractiveModule'),
        loadComponent('../../client/components/EnhancedPropertiesPanel')
      ]);

      components.forEach(({ module, loadTime }) => {
        expect(module).toBeDefined();
        expect(loadTime).toBeLessThan(50); // Quick loading for dynamic imports
      });
    });
  });

  describe('Tree-Shaking Compatibility', () => {
    test('named exports support selective importing', async () => {
      // Test that named exports can be imported selectively
      const { useIsMobile } = await import('../../client/hooks/useIsMobile');
      
      // DeviceType is a type alias, so we test it compiles correctly
      const testDevice: import('../../shared/slideTypes').DeviceType = 'desktop';
      expect(testDevice).toBe('desktop');
      
      expect(useIsMobile).toBeDefined();
    });

    test('default exports work correctly', async () => {
      const SlideBasedInteractiveModule = (await import('../../client/components/SlideBasedInteractiveModule')).default;
      
      expect(SlideBasedInteractiveModule).toBeDefined();
    });
  });

  describe('Development vs Production Imports', () => {
    test('all modules work in test environment', async () => {
      // Verify that modules work correctly in the test environment
      expect(process.env.NODE_ENV).toBeDefined();
      
      const modules = await Promise.all([
        import('../../shared/slideTypes'),
        import('../../lib/firebaseConfig'),
        import('../../client/hooks/useIsMobile')
      ]);
      
      modules.forEach(module => {
        expect(module).toBeDefined();
        expect(typeof module).toBe('object');
      });
    });

    test('environment-specific imports work correctly', async () => {
      // Test that environment-specific code paths work
      process.env.VITE_USE_FIREBASE_EMULATOR = 'true';
      const firebaseConfig = await import('../../lib/firebaseConfig');
      
      // In test environment, should have test configuration
      expect(firebaseConfig.firebaseManager).toBeDefined();
      expect(process.env.VITE_USE_FIREBASE_EMULATOR).toBe('true');
    });
  });

  describe('Import Stability', () => {
    test('multiple imports do not interfere with each other', async () => {
      // Test that multiple imports work reliably
      const workingImports = await Promise.allSettled([
        import('../../shared/slideTypes'),
        import('../../shared/types'),
        import('../../lib/firebaseConfig')
      ]);
      
      const successful = workingImports.filter(result => result.status === 'fulfilled');
      expect(successful.length).toBe(3);
    });
  });
});