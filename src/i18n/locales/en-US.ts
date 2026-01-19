/**
 * English (US) translations
 */

import type { TranslationData } from '../types';

export const enUS: TranslationData = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirm: 'Confirm',
    close: 'Close',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    settings: 'Settings',
    export: 'Export',
    import: 'Import',
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    switchLanguage: 'Switch Language',
    unknown: 'Unknown',

    languageSwitcher: {
      tooltip: 'Switch language here',
      chinese: '中文',
      english: 'English',
    },
  },

  pages: {
    mainView: {
      title: 'Prompt Studio',
      noProject: 'Please select or create a project',
      noProjectHint: 'Click "Create Project" button on the left to start',
      versionName: 'Version Name',
      versionNamePlaceholder: '(Optional) Add a name for this version',
      attachments: 'Attachments',
      unsaved: 'Unsaved',
      unsavedSaveFailed: 'Unsaved (save failed)',
      saving: 'Saving...',
      drafts: {
        bannerTitle: 'Unsaved content found',
        snapshot: 'Snapshot',
        draft: 'Draft',
        baseChangedHint:
          'Note: this version changed after your last edit. It is recommended to view the diff before deciding.',
        bannerHelp:
          '"Resume editing" switches the editor to your unsaved content; "Discard changes" deletes the unsaved content and keeps the saved version.',
        resumeEditing: 'Resume editing',
        discardDraftSimple: 'Discard changes',
        viewDiff: 'View diff',

        switchTitle: 'This version has unsaved content',
        switchDescription:
          'The version you are about to open has unsaved content. To avoid losing it, please choose what to do first.',
        restoreAndOpen: 'Open with unsaved content',
        discardAndOpen: 'Open without unsaved content',
        cancelSwitch: 'Do not switch',
      },
      unsavedChanges: {
        title: 'Unsaved changes',
        description: 'You have unsaved changes. Continuing will overwrite them.',
        keep: 'Save & continue',
        discard: 'Continue without saving',
        cancel: 'Cancel',
      },
      toasts: {
        saved: 'Saved',
        savedNewVersion: 'Saved as a new version',
        savingInProgress: 'Saving... please wait',
      },
    },

    settings: {
      title: 'Settings',
      menu: {
        local: 'Local Import/Export',
        sync: 'Sync & Config',
        theme: 'Theme & Colors',
      },

      local: {
        title: 'Local Import/Export',
        description:
          'Manage your local data manually. You can export all projects and version history to a ZIP archive or restore your workspace from a previous backup.',
        exportZip: 'Export as ZIP',
        importZip: 'Import from ZIP',
        unsupportedFormat: 'Unsupported file format',
        importSuccess: 'Import successful',
        importFailed: 'Import failed',
        exportFailed: 'Export failed',
        configSync: {
          title: 'Quick Config Sync',
          description:
            'Copy current WebDAV settings as JSON and paste on another device to speed up setup.',
          copyJson: 'Generate & Copy JSON',
          applyJson: 'Apply from JSON',
          placeholder:
            'Paste config JSON here, or click above to generate from current settings...',
          copySuccess: 'Config copied to clipboard',
          copyFailed: 'Copy failed, please copy manually',
          parseFailed: 'Failed to parse JSON, please check the format',
          applySuccess: 'Config applied',
        },
        importMode: {
          selectMode: 'Select Import Mode',
          mergeMode: 'Merge Import (Recommended)',
          mergeModeDescription:
            'Keep existing data and only import new data. Uses UUID to determine if data already exists.',
          overwriteMode: 'Overwrite Import',
          overwriteModeDescription:
            'Clear existing data before importing. This action cannot be undone, please proceed with caution.',
        },
      },
      theme: {
        title: 'Theme & Colors',
        description:
          'Pick light/dark mode and customize the global primary color. The color is saved in backups for transfer.',
        primaryColor: 'Primary Color',
        reset: 'Reset to Default',
        mode: 'Theme Mode',
        light: 'Light',
        dark: 'Dark',
        toggle: 'Toggle',
      },
      webdav: {
        title: 'WebDAV Configuration',
        description:
          'Configure a remote WebDAV server to sync your prompt library across multiple devices.',
        serverUrl: 'Server URL',
        username: 'Username',
        password: 'Password',
        testConnection: 'Test Connection',
        testing: 'Testing...',
        connected: 'Connected',
        connectionSuccess: 'Connection successful',
        connectionFailed: 'Connection failed',
        configureFirst: 'Please configure WebDAV first',
        backupToWebdav: 'Backup to WebDAV',
        restoreFromWebdav: 'Restore from WebDAV',
        backingUp: 'Backing up...',
        loading: 'Loading...',
        backupSuccess: 'Backup successful',
        backupFailed: 'Backup failed',
        restoreSuccess: 'Restore successful',
        restoreFailed: 'Restore failed',
        confirmRestore:
          'Are you sure you want to restore this backup? Current data will be overwritten!',
        restoreModalTitle: 'Select backup to restore',
        noBackups: 'No backups available',
        restore: 'Restore',
        delete: 'Delete',
        confirmDelete: 'Are you sure you want to delete this backup?',
        deleteSuccess: 'Delete successful',
        deleteFailed: 'Delete failed',
      },

      errors: {
        unknown: 'Unknown error',
        loadBackupsFailed: 'Failed to load backup list',
      },
    },

    snippetLibrary: {
      title: 'Snippet Library',
      createSnippet: 'Create Snippet',
      editSnippet: 'Edit Snippet',
      deleteSnippet: 'Delete Snippet',
      snippetName: 'Snippet Name',
      snippetContent: 'Snippet Content',
      noSnippets: 'No snippets yet',
    },
  },

  components: {
    editor: {
      placeholder: 'Enter your prompt here...',
    },

    toolbar: {
      saveNew: 'Save New Version',
      saveInPlace: 'Save In Place',
      compare: 'Compare',
      export: 'Export',
      snippets: 'Snippets',
    },

    sidebar: {
      projects: 'Projects',
      createProject: 'Create Project',
      createFolder: 'Create Folder',
      renameProject: 'Rename',
      deleteProject: 'Delete',
      noProjects: 'No projects yet',
      projectName: 'Project Name',
      folderName: 'Folder Name',
      expandSidebar: 'Expand Sidebar',
      collapseSidebar: 'Collapse Sidebar',
    },

    canvas: {
      search: 'Search',
      searchPlaceholder: 'Search versions...',
      noResults: 'No matching versions found',
      selectProject: 'Please select a project',
      prevResult: 'Previous result (Shift+Enter)',
      nextResult: 'Next result (Enter)',
      clearSearch: 'Clear search',
      closeSearch: 'Close search (ESC)',
      compare: 'Compare',
      exitCompare: 'Exit Compare',
      enterCompare: 'Click compare to enter comparison mode',
      deleteVersion: 'Delete this version',
      confirmDelete:
        'Are you sure you want to delete this version? Child versions will be connected to the parent version.',
      deleteFailed: 'Delete failed',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      resetView: 'Reset View',
    },

    versionCard: {
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      duplicate: 'Duplicate',
      delete: 'Delete',
      compare: 'Compare',
      emptyContent: 'Empty content',
      leafNode: 'Leaf node (can be updated in place)',
    },

    compareModal: {
      title: 'Version Comparison',
      source: 'Source Version',
      target: 'Target Version',
      close: 'Close',
      noDifference: 'Both versions have the same content',
      similarity: 'Similarity',
      score: 'Score',
      notes: 'Notes',
    },

    attachmentGallery: {
      upload: 'Upload Attachment',
      delete: 'Delete',
      noAttachments: 'No attachments yet',
      unsupportedType: 'Unsupported file type',
      fileTooLarge: 'File exceeds 50MB limit',
      uploadFailed: 'Upload failed',
      confirmDelete: 'Are you sure you want to delete this attachment?',
      deleteFailed: 'Delete failed',
      fileMissing: 'Attachment file is missing or corrupted',
      downloadFailed: 'Download failed',
      clickToUpload: 'Click to upload',
      imageVideo: 'Image/Video',
      maxSize: 'Max 50MB',
      attachmentMissing: 'Attachment Missing',
      preview: 'Preview',
      download: 'Download',
    },

    versionMeta: {
      clearScore: 'Clear Score',
      noNotes: 'No notes',
      addNotes: 'Add notes...',
      done: 'Done',
    },
  },

  sampleData: {
    projectName: 'Sample Project',
    versions: {
      root: {
        name: 'Playful Puppy',
        content: 'A cute puppy playing on the lush green grass in a spring park',
      },
      branch1: {
        name: 'Majestic Dog',
        content: 'A majestic German Shepherd playing on the lush green grass in a spring park',
      },
      branch2: {
        name: 'Winter Puppy',
        content: 'A cute puppy playing on the snow-covered grass in a winter park',
      },
    },
  },

  errors: {
    generic: 'An error occurred',
    saveFailed: 'Save failed',
    loadFailed: 'Load failed',
    deleteFailed: 'Delete failed',
    exportFailed: 'Export failed',
    importFailed: 'Import failed',
    projectNotFound: 'Project not found or has been deleted',
  },
};
