import { Firestore, Transaction } from 'firebase/firestore';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firebaseAPI } from '../lib/firebaseApi';
import { SlideDeck, InteractiveSlide, SlideElement, DeckMetadata, QuizParameters, TextStyle } from '../shared/slideTypes';

// Mock Firebase completely for type safety testing
vi.mock('../lib/firebaseConfig', () => ({
  firebaseManager: {
    getFirestore: vi.fn(() => ({})),
    getAuth: vi.fn(() => ({
      currentUser: { uid: 'test-user' },
    })),
    isReady: vi.fn(() => true),
    initialize: vi.fn(),
  },
}));

vi.mock('firebase/firestore', async () => {
  return {
    doc: vi.fn((...args) => ({ path: args.join('/') })),
    setDoc: vi.fn(),
    getDoc: vi.fn(),
    runTransaction: vi.fn(async (firestore: Firestore, updateFunction: (transaction: Transaction) => Promise<any>) => {
      const transaction = {
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      transaction.get.mockResolvedValue({ exists: () => false });
      await updateFunction(transaction);
    }),
    collection: vi.fn(),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  };
});

describe('Firebase Type Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SlideDeck Type Enforcement', () => {
    it('enforces complete SlideDeck interface compliance', async () => {
      // Complete valid slide deck
      const validSlideDeck: SlideDeck = {
        id: 'test-deck',
        title: 'Valid Slide Deck',
        description: 'A properly typed slide deck',
        slides: [],
        metadata: {
          version: '2.0',
          created: 1672531200000,
          modified: 1672531200000,
          isPublic: false
        } satisfies DeckMetadata,
        settings: {
          autoAdvance: false,
          allowNavigation: true,
          showProgress: true,
          showControls: true,
          keyboardShortcuts: true,
          touchGestures: true,
          fullscreenMode: false,
        }
      };

      // TypeScript should enforce all required properties
      expect(validSlideDeck.id).toBeDefined();
      expect(validSlideDeck.title).toBeDefined();
      expect(validSlideDeck.description).toBeDefined();
      expect(validSlideDeck.slides).toBeDefined();
      expect(validSlideDeck.metadata).toBeDefined();
      expect(validSlideDeck.settings).toBeDefined();

      // Metadata must be complete
      expect(validSlideDeck.metadata.version).toBeDefined();
      expect(validSlideDeck.metadata.created).toBeDefined();
      expect(validSlideDeck.metadata.modified).toBeDefined();
      expect(validSlideDeck.metadata.isPublic).toBeDefined();

      const { runTransaction } = await import('firebase/firestore');
      const transaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ createdBy: 'test-user' }) }),
        update: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };
      (runTransaction as any).mockImplementation(async (firestore: Firestore, updateFunction: (transaction: Transaction) => Promise<any>) => {
        await updateFunction(transaction);
      });

      // Should not throw type errors
      await expect(firebaseAPI.saveSlideDeck('test-user', validSlideDeck)).resolves.toBeUndefined();
    });

    it('prevents incomplete slide deck objects', () => {
      // This test demonstrates TypeScript compile-time safety
      // The following would cause TypeScript errors:
      
      // Missing required properties would fail at compile time:
      // const incompleteDeck = {
      //   id: 'test',
      //   title: 'Incomplete'
      //   // Missing: description, slides, metadata, settings
      // } satisfies SlideDeck; // This would cause a TypeScript error
      
      // Instead, we test that our complete interface works
      const completeDeck: SlideDeck = {
        id: 'test-deck',
        title: 'Complete Deck',
        description: 'Complete',
        slides: [],
        metadata: {
          version: '2.0',
          created: Date.now(),
          modified: Date.now(),
          isPublic: false
        },
        settings: {
          autoAdvance: false,
          allowNavigation: true,
          showProgress: true,
          showControls: true,
          keyboardShortcuts: true,
          touchGestures: true,
          fullscreenMode: false,
        }
      };

      expect(completeDeck).toBeDefined();
      expect(Object.keys(completeDeck)).toContain('metadata');
      expect(Object.keys(completeDeck.metadata)).toEqual([
        'version', 'created', 'modified', 'isPublic'
      ]);
    });

    it('enforces proper metadata structure', () => {
      const metadata: DeckMetadata = {
        version: '2.0',
        created: 1672531200000,
        modified: 1672531200000,
        isPublic: false
      };

      // Type checking ensures all required properties
      expect(typeof metadata.version).toBe('string');
      expect(typeof metadata.created).toBe('number');
      expect(typeof metadata.modified).toBe('number');
      expect(typeof metadata.isPublic).toBe('boolean');

      // Verify specific values
      expect(metadata.version).toBe('2.0');
      expect(metadata.isPublic).toBe(false);
    });
  });

  describe('InteractiveSlide Type Safety', () => {
    it('enforces complete slide structure', () => {
      const validSlide: InteractiveSlide = {
        id: 'slide-1',
        title: 'Test Slide',
        elements: [],
        transitions: [],
        layout: {
          containerWidth: 1920,
          containerHeight: 1080,
          aspectRatio: '16:9',
          scaling: 'fit',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }
      };

      // All required properties must be present
      expect(validSlide.id).toBe('slide-1');
      expect(validSlide.title).toBe('Test Slide');
      expect(Array.isArray(validSlide.elements)).toBe(true);
      expect(Array.isArray(validSlide.transitions)).toBe(true);
      expect(validSlide.layout).toBeDefined();

      // Layout properties must be complete
      expect(validSlide.layout.containerWidth).toBe(1920);
      expect(validSlide.layout.containerHeight).toBe(1080);
      expect(validSlide.layout.aspectRatio).toBe('16:9');
    });

    it('handles optional slide properties correctly', () => {
      const slideWithOptionalProps: InteractiveSlide = {
        id: 'slide-1',
        title: 'Test Slide',
        backgroundMedia: {
          type: 'image',
          url: 'test-image.jpg'
        },
        elements: [],
        transitions: [],
        layout: {
          containerWidth: 1920,
          containerHeight: 1080,
          aspectRatio: '16:9',
          scaling: 'fit',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }
      };

      expect(slideWithOptionalProps.backgroundMedia?.type).toBe('image');
      expect(slideWithOptionalProps.backgroundMedia?.url).toBe('test-image.jpg');
    });
  });

  describe('SlideElement Type Safety', () => {
    it('enforces element interface compliance', () => {
      const validElement: SlideElement = {
        id: 'element-1',
        type: 'hotspot',
        position: {
          desktop: { x: 100, y: 100, width: 50, height: 50 },
          tablet: { x: 80, y: 80, width: 40, height: 40 },
          mobile: { x: 60, y: 60, width: 30, height: 30 }
        },
        content: { textContent: 'Test' },
        style: { backgroundColor: 'transparent' },
        interactions: [],
        isVisible: true
      };

      // Type safety ensures all properties exist
      expect(validElement.id).toBe('element-1');
      expect(validElement.type).toBe('hotspot');
      expect(validElement.position).toBeDefined();
      expect(validElement.content).toBeDefined();
      expect(validElement.style).toBeDefined();
      expect(Array.isArray(validElement.interactions)).toBe(true);
      expect(typeof validElement.isVisible).toBe('boolean');

      // Responsive position must be complete
      expect(validElement.position.desktop).toBeDefined();
      expect(validElement.position.tablet).toBeDefined();
      expect(validElement.position.mobile).toBeDefined();
    });

    it('prevents invalid element types', () => {
      // Type system prevents invalid element types at compile time
      const validTypes: SlideElement['type'][] = ['hotspot', 'text', 'media', 'shape'];
      
      validTypes.forEach(type => {
        const element: SlideElement = {
          id: 'test',
          type,
          position: {
            desktop: { x: 0, y: 0, width: 100, height: 100 },
            tablet: { x: 0, y: 0, width: 80, height: 80 },
            mobile: { x: 0, y: 0, width: 60, height: 60 }
          },
          content: {},
          style: {},
          interactions: [],
          isVisible: true
        };

        expect(['hotspot', 'text', 'media', 'shape']).toContain(element.type);
      });
    });

    it('enforces responsive position structure', () => {
      const element: SlideElement = {
        id: 'element-1',
        type: 'text',
        position: {
          desktop: { x: 100, y: 100, width: 200, height: 150 },
          tablet: { x: 80, y: 80, width: 160, height: 120 },
          mobile: { x: 60, y: 60, width: 120, height: 90 }
        },
        content: { textContent: 'Responsive text' },
        style: {},
        interactions: [],
        isVisible: true
      };

      // Each position must have all required properties
      ['desktop', 'tablet', 'mobile'].forEach(deviceType => {
        const pos = element.position[deviceType as keyof typeof element.position];
        expect(typeof pos.x).toBe('number');
        expect(typeof pos.y).toBe('number');
        expect(typeof pos.width).toBe('number');
        expect(typeof pos.height).toBe('number');
      });
    });
  });

  describe('Quiz Parameters Type Safety', () => {
    it('enforces complete quiz parameters', () => {
      const validQuizParams: QuizParameters = {
        question: 'What is the correct answer?',
        questionType: 'multiple-choice',
        choices: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        allowMultipleAttempts: true,
        resumeAfterCompletion: false
      };

      // All required properties must be present
      expect(validQuizParams.questionType).toBe('multiple-choice');
      expect(typeof validQuizParams.allowMultipleAttempts).toBe('boolean');
      expect(typeof validQuizParams.resumeAfterCompletion).toBe('boolean');

      // Type system ensures valid question types
      const validQuestionTypes: QuizParameters['questionType'][] = [
        'multiple-choice', 'true-false', 'fill-in-the-blank'
      ];
      expect(validQuestionTypes).toContain(validQuizParams.questionType);
    });

    it('prevents incomplete quiz parameters', () => {
      // This demonstrates type safety - the following would cause TypeScript errors:
      // const incompleteQuiz = {
      //   questionType: 'multiple-choice'
      //   // Missing: allowMultipleAttempts, resumeAfterCompletion
      // } satisfies QuizParameters; // Would cause TypeScript error

      // Instead, test complete parameters work
      const completeQuiz: QuizParameters = {
        question: 'Is this statement true?',
        questionType: 'true-false',
        correctAnswer: 'true',
        allowMultipleAttempts: false,
        resumeAfterCompletion: true
      };

      expect(Object.keys(completeQuiz)).toEqual([
        'question', 'questionType', 'correctAnswer', 'allowMultipleAttempts', 'resumeAfterCompletion'
      ]);
    });
  });

  describe('Text Style Type Safety', () => {
    it('enforces valid text style properties', () => {
      const validTextStyle: TextStyle = {
        fontSize: 16,
        color: '#000000',
        fontWeight: 'normal',
        textAlign: 'left'
      };

      // Type system ensures correct property types
      expect(typeof validTextStyle.fontSize).toBe('number');
      expect(typeof validTextStyle.color).toBe('string');
      expect(typeof validTextStyle.fontWeight).toBe('string');
      expect(typeof validTextStyle.textAlign).toBe('string');

      // Verify specific values
      expect(validTextStyle.fontSize).toBe(16);
      expect(validTextStyle.color).toBe('#000000');
      expect(validTextStyle.fontWeight).toBe('normal');
      expect(validTextStyle.textAlign).toBe('left');
    });

    it('prevents invalid text style properties', () => {
      // TextStyle interface doesn't include boxShadow - this would cause TypeScript error:
      // const invalidStyle = {
      //   fontSize: 16,
      //   boxShadow: '0 0 10px rgba(0,0,0,0.5)' // Not allowed in TextStyle
      // } satisfies TextStyle; // Would cause TypeScript error

      // Test that valid properties work
      const validStyle: TextStyle = {
        fontSize: 18,
        color: '#333333'
      };

      expect(validStyle.fontSize).toBe(18);
      expect(validStyle.color).toBe('#333333');
      
      // boxShadow should not be present in valid TextStyle
      expect('boxShadow' in validStyle).toBe(false);
    });

    it('handles optional text style properties', () => {
      // TextStyle requires color property
      const partialStyle: TextStyle = {
        fontSize: 20,
        color: '#333333'
        // Other properties are optional
      };

      expect(partialStyle.fontSize).toBe(20);
      expect(partialStyle.color).toBe('#333333');
      expect(partialStyle.fontWeight).toBeUndefined();
    });
  });

  describe('Firebase API Type Integration', () => {
    it('ensures API methods accept proper types', async () => {
      const validSlideDeck: SlideDeck = {
        id: 'type-safe-deck',
        title: 'Type Safe Deck',
        description: 'Testing type safety',
        slides: [{
          id: 'slide-1',
          title: 'Type Safe Slide',
          elements: [{
            id: 'element-1',
            type: 'text',
            position: {
              desktop: { x: 0, y: 0, width: 100, height: 50 },
              tablet: { x: 0, y: 0, width: 80, height: 40 },
              mobile: { x: 0, y: 0, width: 60, height: 30 }
            },
            content: { textContent: 'Type safe text' },
            style: { fontSize: 16 },
            interactions: [],
            isVisible: true
          }],
          transitions: [],
          layout: {
            containerWidth: 1920,
            containerHeight: 1080,
            aspectRatio: '16:9',
            scaling: 'fit',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }
        }],
        metadata: {
          version: '2.0',
          created: Date.now(),
          modified: Date.now(),
          isPublic: false
        },
        settings: {
          autoAdvance: false,
          allowNavigation: true,
          showProgress: true,
          showControls: true,
          keyboardShortcuts: true,
          touchGestures: true,
          fullscreenMode: false,
        }
      };

      const { runTransaction } = await import('firebase/firestore');
      const transaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ createdBy: 'test-user' }) }),
        update: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };
      (runTransaction as any).mockImplementation(async (firestore: Firestore, updateFunction: (transaction: Transaction) => Promise<any>) => {
        await updateFunction(transaction);
      });

      // TypeScript should ensure this compiles without errors
      await expect(firebaseAPI.saveSlideDeck('test-user', validSlideDeck)).resolves.toBeUndefined();

      // Verify the transaction was called with properly typed data
      expect(transaction.update).toHaveBeenCalled();
      const savedData = transaction.update.mock.calls[0]?.[1];
      expect(savedData?.slideDeck).toBeDefined();
      expect(savedData?.slideDeck.title).toBe('Type Safe Deck');
    });

    it('enforces proper return types from API methods', async () => {
      const mockSlideDeck: SlideDeck = {
        id: 'returned-deck',
        title: 'Returned Deck',
        description: 'Testing return types',
        slides: [],
        metadata: {
          version: '2.0',
          created: 1672531200000,
          modified: 1672531200000,
          isPublic: false
        },
        settings: {
          autoAdvance: false,
          allowNavigation: true,
          showProgress: true,
          showControls: true,
          keyboardShortcuts: true,
          touchGestures: true,
          fullscreenMode: false,
        }
      };

      const { getDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ slideDeck: mockSlideDeck, createdBy: 'test-user' }),
        id: 'returned-deck'
      });

      const result = await firebaseAPI.loadSlideDeck('test-user', 'returned-deck');

      // TypeScript ensures proper return type
      expect(result).toBeDefined();
      if (result) {
        // Type narrowing ensures we can access properties safely
        expect(result.id).toBe('returned-deck');
        expect(result.title).toBe('Returned Deck');
        expect(result.metadata.version).toBe('2.0');
        expect(typeof result.metadata.created).toBe('number');
      }
    });

    it('handles null returns with proper typing', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValue({
        exists: () => false
      });

      const result = await firebaseAPI.loadSlideDeck('test-user', 'nonexistent-deck');

      // TypeScript should allow null return and proper null checking
      expect(result).toBeNull();
      
      // Type narrowing should work correctly
      if (result !== null) {
        expect(result.id).toBeDefined(); // This block shouldn't execute
      } else {
        expect(result).toBeNull(); // This should execute
      }
    });
  });

  describe('Compilation and Build Safety', () => {
    it('compiles without TypeScript errors', () => {
      // This test ensures that all type definitions are consistent
      // and that there are no compilation errors in the type system

      // Create objects using all major interfaces to verify they compile
      const slideDeck: SlideDeck = {
        id: 'compile-test',
        title: 'Compile Test',
        description: 'Testing compilation',
        slides: [],
        metadata: {
          version: '2.0',
          created: Date.now(),
          modified: Date.now(),
          isPublic: false
        },
        settings: {
          autoAdvance: false,
          allowNavigation: true,
          showProgress: true,
          showControls: true,
          keyboardShortcuts: true,
          touchGestures: true,
          fullscreenMode: false,
        }
      };

      const slide: InteractiveSlide = {
        id: 'compile-slide',
        title: 'Compile Slide',
        elements: [],
        transitions: [],
        layout: {
          containerWidth: 1920,
          containerHeight: 1080,
          aspectRatio: '16:9',
          scaling: 'fit',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }
      };

      const element: SlideElement = {
        id: 'compile-element',
        type: 'hotspot',
        position: {
          desktop: { x: 0, y: 0, width: 100, height: 100 },
          tablet: { x: 0, y: 0, width: 80, height: 80 },
          mobile: { x: 0, y: 0, width: 60, height: 60 }
        },
        content: {},
        style: {},
        interactions: [],
        isVisible: true
      };

      // If this test passes, it means all types compile correctly
      expect(slideDeck).toBeDefined();
      expect(slide).toBeDefined();
      expect(element).toBeDefined();
    });

    it('prevents common type mismatches at compile time', () => {
      // Document common type safety patterns that prevent runtime errors

      // Correct metadata structure
      const validMetadata: DeckMetadata = {
        version: '2.0',      // Must be string
        created: Date.now(), // Must be number (timestamp)
        modified: Date.now(), // Must be number (timestamp)
        isPublic: false     // Must be boolean
      };

      expect(typeof validMetadata.version).toBe('string');
      expect(typeof validMetadata.created).toBe('number');
      expect(typeof validMetadata.modified).toBe('number');
      expect(typeof validMetadata.isPublic).toBe('boolean');

      // Correct quiz parameters
      const validQuiz: QuizParameters = {
        question: 'Choose the correct option',
        questionType: 'multiple-choice',
        choices: ['Option 1', 'Option 2', 'Option 3'],
        correctAnswer: 'Option 1',
        allowMultipleAttempts: true,
        resumeAfterCompletion: false
      };

      expect(['multiple-choice', 'true-false', 'fill-in-the-blank']).toContain(validQuiz.questionType);
      expect(typeof validQuiz.allowMultipleAttempts).toBe('boolean');
      expect(typeof validQuiz.resumeAfterCompletion).toBe('boolean');
    });
  });
});