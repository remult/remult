<template>

    <div class="editor">
        <div class="editor-header">Customer Portal</div>
        <div class="editor-body">

            <div class="editor-sidebar">
                <span>Commit History</span>
                <button>define a model</button>
                <button>add validation</button>
                <button>pre-save hook</button>
            </div>

            <div class="editor-content">
                <div class="editor-tabs">
                    <button>Customer.ts</button>
                    <button>CustomerList.tsx</button>
                </div>

                <div class="editor-code">
                    Shiki here
                </div>

                <div class="editor-footer">
                    <a href="/docs">More about validation</a>
                    <a href="/docs">More about auth</a>
                </div>
            </div>
        </div>
    </div>
</template>


<style>
    .editor {
        background: #050638;
        border-radius: 3px;
    }

    .editor-header {
        display: flex;
        justify-content: center;
    }
</style>

