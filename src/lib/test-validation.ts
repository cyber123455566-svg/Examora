export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface QuestionForValidation {
  id?: string;
  orderIndex?: number;
  questionText: string;
  questionType: string;
  marks: number;
  correctAnswer: string;
  options?: { optionKey: string; optionText: string }[];
}

export interface TestForValidation {
  title: string;
  subject: string;
  durationMinutes: number;
  startAt?: Date | string | null;
  endAt?: Date | string | null;
  questions: QuestionForValidation[];
}

/**
 * Validates whether a test can be published according to V0.2 rules.
 */
export function validateTestForPublishing(test: TestForValidation): ValidationResult {
  const errors: string[] = [];

  // 1. Basic information
  if (!test.title || test.title.trim().length === 0) {
    errors.push("Test title is required.");
  }

  if (!test.subject || test.subject.trim().length === 0) {
    errors.push("Subject is required.");
  }

  // 2. Duration
  if (!test.durationMinutes || test.durationMinutes <= 0) {
    errors.push("Duration must be at least 1 minute.");
  }

  // 3. Scheduling dates
  if (test.startAt && test.endAt) {
    const startDate = new Date(test.startAt);
    const endDate = new Date(test.endAt);
    if (endDate <= startDate) {
      errors.push("End date and time must be after the start date and time.");
    }
  }

  // 4. Questions existence
  if (!test.questions || test.questions.length === 0) {
    errors.push("Add at least one question before publishing.");
    return {
      isValid: false,
      errors,
    };
  }

  // 5. Individual question validation
  test.questions.forEach((q, idx) => {
    const qNum = idx + 1;

    if (!q.questionText || q.questionText.trim().length === 0) {
      errors.push(`Question ${qNum}: Question text is required.`);
    }

    if (!q.marks || q.marks <= 0) {
      errors.push(`Question ${qNum}: Marks must be at least 1.`);
    }

    if (q.questionType === "MULTIPLE_CHOICE") {
      const options = q.options || [];
      if (options.length < 2) {
        errors.push(`Question ${qNum} (Multiple Choice): Must have at least Options A, B, C, and D configured.`);
      } else {
        const emptyOptions = options.filter((o) => !o.optionText || o.optionText.trim().length === 0);
        if (emptyOptions.length > 0) {
          errors.push(
            `Question ${qNum} (Multiple Choice): Option ${emptyOptions.map((o) => o.optionKey).join(", ")} cannot be blank.`
          );
        }
      }

      if (!q.correctAnswer || q.correctAnswer.trim().length === 0) {
        errors.push(`Question ${qNum} (Multiple Choice): A correct option must be selected.`);
      }
    } else if (q.questionType === "TRUE_FALSE") {
      if (q.correctAnswer !== "TRUE" && q.correctAnswer !== "FALSE") {
        errors.push(`Question ${qNum} (True/False): A valid correct answer (True or False) must be set.`);
      }
    } else if (q.questionType === "SHORT_ANSWER") {
      if (!q.correctAnswer || q.correctAnswer.trim().length === 0) {
        errors.push(`Question ${qNum} (Short Answer): Expected answer cannot be blank.`);
      }
    } else {
      errors.push(`Question ${qNum}: Unknown question type "${q.questionType}".`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
