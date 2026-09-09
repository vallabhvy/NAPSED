import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://ppchpqjpmrcxocjjqmza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwY2hwcWpwbXJjeG9jampxbXphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTYxOTEwOSwiZXhwIjoyMTAxMTk1MTA5fQ.vwLXLQAoWcGg6h9gA27C8hz2XUSLJtfMB-lHpgdghSA';
const supabase = createClient(supabaseUrl, supabaseKey);

const genId = (slug) => `prac-oop-${slug.replace(/-/g, '')}`;

const oopSpecs = [
  {
    schemaVersion: '1.0.0',
    specType: 'PRACTICE',
    specId: genId('solid-s-encapsulation'),
    slug: 'solid-s-encapsulation',
    title: 'SOLID-S: Refactor for Encapsulation',
    track: 'OBJECT_ORIENTED_DESIGN',
    difficulty: 'BEGINNER',
    estimatedTimeToSolveMinutes: 10,
    brief: {
      overview: 'Refactor a "God Object" order processing class that handles business rules, database access, and email logic into smaller, cohesive classes following the Single Responsibility Principle.',
      requirements: [
        'Move database operations into an OrderRepository.',
        'Move notification logic into a NotificationService.',
        'Refactor the main class to only handle order business logic.',
      ],
      hintsOrConstraints: [
        'Each class should have only one reason to change.',
        'Inject dependencies into the business logic class.'
      ]
    },
    workspace: {
      runtime: 'node20',
      testCommand: 'npm test',
      files: [
        {
          path: 'src/god_object.ts',
          readOnly: false,
          content: "// BUG: This class violates SOLID-S\nclass GodObject {\n  processOrder(order: any) {\n    // Business logic...\n    // DB logic...\n    // Email logic...\n  }\n}"
        },
        {
          path: 'src/god_object.test.ts',
          readOnly: true,
          content: "test('GOD-S', () => {});"
        }
      ]
    },
    defenseGate: {
      question: 'What did you do, and why did you do that?',
      placeholder: 'Explain how you separated concerns and why this improves maintainability...',
      minCharacters: 40
    }
  },
  {
    schemaVersion: '1.0.0',
    specType: 'PRACTICE',
    specId: genId('solid-o-strategy'),
    slug: 'solid-o-strategy',
    title: 'SOLID-O: Strategy Pattern',
    track: 'OBJECT_ORIENTED_DESIGN',
    difficulty: 'INTERMEDIATE',
    estimatedTimeToSolveMinutes: 20,
    brief: {
      overview: 'A shipping calculator uses a massive switch statement to determine costs based on carriers. Apply the Open/Closed Principle using the Strategy Pattern to make it extensible without modifying existing code.',
      requirements: [
        'Create a ShippingStrategy interface.',
        'Implement concrete strategies for FedEx, UPS, and USPS.',
        'Refactor the ShippingCalculator to accept a strategy via its constructor.'
      ],
      hintsOrConstraints: [
        'You should be able to add a DHL strategy later without modifying ShippingCalculator.'
      ]
    },
    workspace: {
      runtime: 'python3.11',
      testCommand: 'pytest test_shipping.py',
      files: [
        {
          path: 'shipping.py',
          readOnly: false,
          content: "class ShippingCalculator:\n    def calculate(self, order, carrier):\n        if carrier == 'FEDEX':\n            return 5.0\n        elif carrier == 'UPS':\n            return 4.5\n        else:\n            return 3.0"
        }
      ]
    },
    defenseGate: {
      question: 'What did you do, and why did you do that?',
      placeholder: 'Explain how the Strategy Pattern achieves the Open/Closed Principle here...',
      minCharacters: 40
    }
  },
  {
    schemaVersion: '1.0.0',
    specType: 'PRACTICE',
    specId: genId('composition-over-inheritance'),
    slug: 'composition-over-inheritance',
    title: 'Composition vs Inheritance',
    track: 'OBJECT_ORIENTED_DESIGN',
    difficulty: 'INTERMEDIATE',
    estimatedTimeToSolveMinutes: 15,
    brief: {
      overview: 'Design a system representing different types of network connections (e.g., HTTP, TCP, QUIC). Instead of creating a complex inheritance hierarchy, use interfaces and composition to mix-in common functionality like error-handling and authentication.',
      requirements: [
        'Implement `HTTPConnection` and `TCPConnection` sharing a `Connection` interface.',
        'Compose a `RetryStrategy` struct into both classes.',
      ],
      hintsOrConstraints: [
        'Avoid deep inheritance chains.',
        'Leverage interface satisfaction for shared behavior.'
      ]
    },
    workspace: {
      runtime: 'go1.22',
      testCommand: 'go test -v ./...',
      files: [
        {
          path: 'pkg/conn/conn.go',
          readOnly: true,
          content: "package conn\n\ntype Connection interface {\n\tConnect() error\n}"
        },
        {
          path: 'pkg/conn/http.go',
          readOnly: false,
          content: "package conn\n\ntype HTTPConnection struct {}\n\nfunc (h *HTTPConnection) Connect() error { return nil }"
        }
      ]
    },
    defenseGate: {
      question: 'What did you do, and why did you do that?',
      placeholder: 'Detail why composition was used over a concrete base class and how it improves flexibility...',
      minCharacters: 60
    }
  },
  {
    schemaVersion: '1.0.0',
    specType: 'PRACTICE',
    specId: genId('state-management'),
    slug: 'state-management',
    title: 'State Management (State Pattern)',
    track: 'OBJECT_ORIENTED_DESIGN',
    difficulty: 'ADVANCED',
    estimatedTimeToSolveMinutes: 25,
    brief: {
      overview: 'Refactor a Document class that uses multiple boolean flags (isDraft, isPublished, isArchived) to control its behavior. Implement the State Pattern to encapsulate state-specific logic.',
      requirements: [
        'Create a DocumentState interface with methods like publish() and archive().',
        'Implement DraftState, PublishedState, and ArchivedState.',
        'Update Document to delegate behavior to its current state object.'
      ],
      hintsOrConstraints: [
        'Transitions between states should be handled by the state objects themselves.'
      ]
    },
    workspace: {
      runtime: 'node20',
      testCommand: 'npm test',
      files: [
        {
          path: 'src/document.ts',
          readOnly: false,
          content: "export class Document {\n  public isDraft = true;\n  public isPublished = false;\n  public publish() {\n    if (this.isDraft) { this.isDraft = false; this.isPublished = true; }\n  }\n}"
        }
      ]
    },
    defenseGate: {
      question: 'What did you do, and why did you do that?',
      placeholder: 'Explain how the State Pattern eliminated the boolean flags...',
      minCharacters: 50
    }
  },
  {
    schemaVersion: '1.0.0',
    specType: 'PRACTICE',
    specId: genId('resource-management-raii'),
    slug: 'resource-management-raii',
    title: 'Resource Management (RAII)',
    track: 'OBJECT_ORIENTED_DESIGN',
    difficulty: 'ADVANCED',
    estimatedTimeToSolveMinutes: 30,
    brief: {
      overview: 'A legacy C++ network client manually allocates and frees sockets, leading to memory leaks when exceptions are thrown. Refactor the code to use RAII (Resource Acquisition Is Initialization).',
      requirements: [
        'Wrap the raw socket handle in a smart pointer or custom RAII class.',
        'Ensure the socket is closed automatically in the destructor.',
        'Remove all manual delete/close calls.'
      ],
      hintsOrConstraints: [
        'std::unique_ptr with a custom deleter is a clean approach.'
      ]
    },
    workspace: {
      runtime: 'cpp20',
      testCommand: 'make test',
      files: [
        {
          path: 'client.cpp',
          readOnly: false,
          content: "void connect() {\n  int* socket = new int(8080);\n  // simulate exception\n  throw std::runtime_error(\"Failed\");\n  delete socket; // Leak!\n}"
        }
      ]
    },
    defenseGate: {
      question: 'What did you do, and why did you do that?',
      placeholder: 'Explain how RAII guarantees resource cleanup even during exceptions...',
      minCharacters: 50
    }
  },
  {
    schemaVersion: '1.0.0',
    specType: 'PRACTICE',
    specId: genId('message-passing-observer'),
    slug: 'message-passing-observer',
    title: 'Message Passing (Observer)',
    track: 'OBJECT_ORIENTED_DESIGN',
    difficulty: 'INTERMEDIATE',
    estimatedTimeToSolveMinutes: 20,
    brief: {
      overview: 'An inventory system directly calls email and SMS APIs when stock is low. Decouple this using the Observer Pattern.',
      requirements: [
        'Create a Subject interface with subscribe and notify methods.',
        'Make the Inventory class implement Subject.',
        'Create EmailAlert and SMSAlert classes that implement an Observer interface.'
      ],
      hintsOrConstraints: [
        'The Inventory class should not know about emails or SMS.'
      ]
    },
    workspace: {
      runtime: 'node20',
      testCommand: 'npm test',
      files: [
        {
          path: 'src/inventory.ts',
          readOnly: false,
          content: "export class Inventory {\n  updateStock(amount: number) {\n    if (amount < 10) {\n      EmailAPI.send('Low stock');\n      SMSAPI.send('Low stock');\n    }\n  }\n}"
        }
      ]
    },
    defenseGate: {
      question: 'What did you do, and why did you do that?',
      placeholder: 'Explain how the Observer Pattern reduced coupling...',
      minCharacters: 40
    }
  },
  {
    schemaVersion: '1.0.0',
    specType: 'PRACTICE',
    specId: genId('creation-control-factory'),
    slug: 'creation-control-factory',
    title: 'Creation Control (Abstract Factory)',
    track: 'OBJECT_ORIENTED_DESIGN',
    difficulty: 'ADVANCED',
    estimatedTimeToSolveMinutes: 30,
    brief: {
      overview: 'A UI framework needs to render buttons and checkboxes for both Windows and macOS. Use the Abstract Factory pattern to group these object creations.',
      requirements: [
        'Create a GUIFactory interface with createButton() and createCheckbox().',
        'Implement WinFactory and MacFactory.',
        'Ensure the client code only depends on the abstract interfaces.'
      ],
      hintsOrConstraints: [
        'Do not use concrete OS classes in the application logic.'
      ]
    },
    workspace: {
      runtime: 'java21',
      testCommand: 'javac Application.java && java Main',
      files: [
        {
          path: 'Application.java',
          readOnly: false,
          content: "public class Application {\n  public void render(String os) {\n    if (os.equals(\"Windows\")) { new WinButton().paint(); }\n    else { new MacButton().paint(); }\n  }\n}"
        }
      ]
    },
    defenseGate: {
      question: 'What did you do, and why did you do that?',
      placeholder: 'Explain how Abstract Factory enforces consistency across product families...',
      minCharacters: 50
    }
  },
  {
    schemaVersion: '1.0.0',
    specType: 'PRACTICE',
    specId: genId('concurrency-actor-model'),
    slug: 'concurrency-actor-model',
    title: 'Concurrency (Actor Model)',
    track: 'OBJECT_ORIENTED_DESIGN',
    difficulty: 'ADVANCED',
    estimatedTimeToSolveMinutes: 35,
    brief: {
      overview: 'A shared counter is being modified by multiple goroutines, causing race conditions. Refactor it to use the Actor Model where state is encapsulated and modified only via message passing over channels.',
      requirements: [
        'Remove the sync.Mutex.',
        'Create a background goroutine (the actor) that listens on a channel.',
        'Send increment and read messages to the actor via channels.'
      ],
      hintsOrConstraints: [
        'Only the actor goroutine should ever touch the integer state.'
      ]
    },
    workspace: {
      runtime: 'go1.22',
      testCommand: 'go test -race ./...',
      files: [
        {
          path: 'counter.go',
          readOnly: false,
          content: "package main\nimport \"sync\"\ntype Counter struct { mu sync.Mutex; val int }\nfunc (c *Counter) Inc() { c.mu.Lock(); defer c.mu.Unlock(); c.val++ }"
        }
      ]
    },
    defenseGate: {
      question: 'What did you do, and why did you do that?',
      placeholder: 'Explain why the Actor model is safer for concurrency than shared memory...',
      minCharacters: 50
    }
  },
  {
    schemaVersion: '1.0.0',
    specType: 'PRACTICE',
    specId: genId('data-integrity-value-objects'),
    slug: 'data-integrity-value-objects',
    title: 'Data Integrity (Value Objects)',
    track: 'OBJECT_ORIENTED_DESIGN',
    difficulty: 'INTERMEDIATE',
    estimatedTimeToSolveMinutes: 20,
    brief: {
      overview: 'A banking application passes currency amounts as primitive floats, leading to bugs. Create a Money value object to encapsulate amount and currency, ensuring immutability.',
      requirements: [
        'Create a Money struct holding amount and currency code.',
        'Implement an Add() method that returns a NEW Money struct.',
        'Throw an error if adding different currencies.'
      ],
      hintsOrConstraints: [
        'Value objects should have no setters (immutable).'
      ]
    },
    workspace: {
      runtime: 'rust1.76',
      testCommand: 'cargo test',
      files: [
        {
          path: 'src/lib.rs',
          readOnly: false,
          content: "pub fn add_money(amt1: f64, curr1: &str, amt2: f64, curr2: &str) -> f64 {\n    amt1 + amt2 // BUG: Ignored currency\n}"
        }
      ]
    },
    defenseGate: {
      question: 'What did you do, and why did you do that?',
      placeholder: 'Explain how Value Objects prevent Primitive Obsession...',
      minCharacters: 50
    }
  },
  {
    schemaVersion: '1.0.0',
    specType: 'PRACTICE',
    specId: genId('structural-alignment-adapter'),
    slug: 'structural-alignment-adapter',
    title: 'Structural Alignment (Adapter)',
    track: 'OBJECT_ORIENTED_DESIGN',
    difficulty: 'BEGINNER',
    estimatedTimeToSolveMinutes: 15,
    brief: {
      overview: 'Your app uses a specific Logger interface, but the new ThirdPartyLogger uses completely different method names. Write an Adapter to make the third-party library compatible with your system.',
      requirements: [
        'Create a LoggerAdapter class implementing your internal Logger interface.',
        'Wrap the ThirdPartyLogger instance inside the adapter.',
        'Translate the method calls appropriately.'
      ],
      hintsOrConstraints: [
        'Do not modify the ThirdPartyLogger source code.'
      ]
    },
    workspace: {
      runtime: 'node20',
      testCommand: 'npm test',
      files: [
        {
          path: 'src/logger.ts',
          readOnly: false,
          content: "interface Logger { log(msg: string): void; }\nclass ThirdParty { warn(msg: string) { console.log(msg); } }\n// TODO: Create Adapter"
        }
      ]
    },
    defenseGate: {
      question: 'What did you do, and why did you do that?',
      placeholder: 'Explain how the Adapter pattern acts as a bridge...',
      minCharacters: 40
    }
  }
];

async function main() {
  console.log('Seeding 10 OOPS/OOP Practice specs...');
  
  for (const manifest of oopSpecs) {
    const baseSpec = {
      id: crypto.randomUUID(),
      slug: manifest.slug,
      spec_id: manifest.specId,
      title: manifest.title,
      spec_type: manifest.specType,
      track: manifest.track,
      difficulty: manifest.difficulty,
      manifest: manifest,
      created_at: new Date().toISOString()
    };

    await supabase.from('specs').delete().eq('slug', baseSpec.slug);
    const { error } = await supabase.from('specs').insert(baseSpec);

    if (error) {
      console.error(`Error inserting ${baseSpec.title}:`, error);
    } else {
      console.log(`✓ Inserted: ${baseSpec.spec_type} // ${baseSpec.title} (${baseSpec.track})`);
    }
  }
}

main().catch(console.error);
