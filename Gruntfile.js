/*
 * Framework DevOps Gruntfile
 *
 * Author(s):  Salvadore Gerace <sgerace@dotdecimal.com>
 *
 * Copyright:  (c) 2014 .decimal, Inc. All rights reserved.
 */

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Grunt export

module.exports = function(grunt) {

    // Environment variables
    process.env['mocha-json-spec-dest'] = './coverage/result.json';

    // Project configuration.
    grunt.initConfig({
        jsdoc: {
            dist: {
                src: [
                    'README.md',
                    'lib/**/*.js'
                ],
                options: {
                    destination: 'docs',
                    configure: 'jsdoc.conf',
                    template: 'support/template'
                }
            }
        },
        jshint: {
            options: {
                globals: {
                    Promise: true
                }
            },
            all: [
                'lib/**/*.js'
            ]
        },
        mocha_istanbul: {
            test: {
                src: './test',
                options: {
                    mask: '**/*.spec.js',
                    recursive: true,
                    root: './lib',
                    reporter: 'mocha-json-spec-reporter',
                    require: ['./test/common.js']
                }
            },
            enforce: {
                src: './test',
                options: {
                    mask: '**/*.spec.js',
                    recursive: true,
                    check: {
                        lines: 100,
                        statements: 100,
                        branches: 100,
                        functions: 100
                    },
                    root: './lib',
                    reporter: 'mocha-json-spec-reporter',
                    require: ['./test/common.js']
                }
            }
        },
        express: {
            options: {
                script: 'server.js',
                args: [],
                output: "AWS-Local Server Ready"
            }
        }
    });

    // --------------------------------------------------
    // Load npm tasks

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-mocha-istanbul');

    // --------------------------------------------------
    // Testing tasks

    grunt.registerTask('test', function(spec) {
        var key = 'mocha_istanbul.test.options.grep';
        if (typeof spec === 'string') {
            grunt.config.set(key, spec);
        }
        grunt.task.run('mocha_istanbul:test');
    });

    // --------------------------------------------------
    // Alias tasks

    grunt.registerTask('server', ['express']);
    grunt.registerTask('documents', ['watch:documents']);

    // --------------------------------------------------
    // Default task

    grunt.registerTask('default', ['jshint', 'jsdoc', 'mocha_istanbul:enforce']);
};