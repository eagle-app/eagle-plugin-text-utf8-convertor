<script setup>
import { t, useContextMenu } from "@/composables";
import Main from "@scripts/main";

const main = reactive(new Main());

const utils = require(`${__dirname}/modules/utils`);

const successDialogVisible = ref(false);

const tableEl = ref(null);

const table = shallowReactive({
  header: {
    status: { name: "", minWidth: 50 },
    name: {
      name: t("main.table.thead.name"),
      minWidth: 50,
      fill: true,
      line: true,
    },
    content: {
      name: t("main.table.thead.content"),
      minWidth: 300,
      line: true,
    },
    convertedContent: {
      name: t("main.table.thead.convertedContent"),
      minWidth: 300,
      line: true,
    },
    encoding: {
      name: t("main.table.thead.encoding"),
      minWidth: 70, 
      line: true,
    },
    remove: { name: "", minWidth: 50, align: "end" },
  },
  contextMenu: [
    {
      label: t("main.table.contextMenu.deleteSuccessful"),
      onClick: async () => {
        main.taskQueue.clear("success");
      },
    },
  ],
});

watch(
  () => main.currentProcessIndex,
  (val) => {
    tableEl.value.scroll(val);
  }
);

eagle.onPluginRun(async () => {
  await main.loadData();
  if (eagle.app.platform === "darwin") await utils.time.sleep(600);
  const index = main.taskQueue.data.indexOf(main.taskQueue.waiting[0]);
  if (index && index !== -1) tableEl.value.scroll(index + 4);
  await main.processData();
});

const onDrop = (files) => {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (!file.path.includes(eagle.library.path)) throw "file not come from Eagle";

    main.taskQueue.enqueue({
      id: /(?<=\images[\\\/])(.*?)(?=\.info)/g.exec(file.path)[0],
      name: file.name,
      ext: file.type.split("/")[1],
      size: file.size,
      filePath: file.path,      
    });
  }
};

provide("main", main);
</script>

<template>
  <HeaderVue></HeaderVue>
  <template v-if="!main.isLoading">
    <DropZoneVue @drop="onDrop">
      <BodyVue v-show="main.taskQueue.data.length">
        <VirtualTableVue
          ref="tableEl"
          class="virtual-table"
          :header="table.header"
          :data="main.taskQueue.data"
          @click.right.prevent="useContextMenu(table.contextMenu)"
        >
          <template #status="scope">
            <ImageVue
              v-for="icon in ['success', 'processing', 'waiting', 'failed']"
              :key="icon"
              v-tippy="{
                content: scope.row.isFailed()
                  ? t(`error.${scope.row.result.message}`)
                  : '',
              }"
              :style="[
                scope.row.isProcessing() ? 'animation: loading 2s infinite linear;' : '',
              ]"
              width="16"
              height="16"
              :src="`light/status-${icon}.svg`"
              :darkSrc="`dark/status-${icon}.svg`"
              v-show="scope.row.result.state === icon"
            ></ImageVue>
          </template>
          <template #name="scope">
            {{ scope.row.name }}
          </template>
          <template #content="scope">
              {{ scope.row.content }}
          </template>
          <template #encoding="scope">
              {{ scope.row.encoding.encoding }}
          </template>          
          <template  #convertedContent="scope">
            {{ scope.row.convertContent }}
          </template>
          <template #remove="scope">
            <ImageVue
              class="remove"
              width="24"
              height="24"
              src="light/remove.svg"
              darkSrc="dark/remove.svg"
              @click="main.taskQueue.dequeue(main.taskQueue.data.indexOf(scope.row))"
            ></ImageVue>
          </template>
        </VirtualTableVue>
      </BodyVue>
      <FooterVue class="footer" v-show="main.taskQueue.data.length">
        <template #default>
          <el-progress
            class="progress"
            :percentage="
              (main.taskQueue.completed.length / main.taskQueue.data.length) * 100
            "
            :show-text="false"
            v-show="main.taskQueue.isWorking"
          />
        </template>
        <template #action>
          <div class="progress-status" v-if="main.taskQueue.isWorking">
            <span>{{ t("footer.convert.isConverting") }}</span>          
            <span>
              {{ main.taskQueue.completed.length }}/{{ main.taskQueue.data.length }}
            </span>
          </div>          
          <el-button
            type="primary"
            :disabled="main.taskQueue.isWorking || main.taskQueue.waiting.length === 0"
            :loading="main.taskQueue.isWorking"
            @click="
              async () => {
                await main.convert();
                successDialogVisible = true;
              }
            "
          >
            <ImageVue
              width="16"
              height="16"
              src="normal/compress.svg"
              v-show="!main.taskQueue.isWorking"
            ></ImageVue>
            {{ t("footer.convert.title") }}
          </el-button>
        </template>
      </FooterVue>

      <el-empty :description="t('main.empty.title')" v-show="!main.taskQueue.data.length">
        <template #image>
          <ImageVue
            width="256"
            height="144"
            src="light/empty.png"
            darkSrc="dark/empty.png"
          ></ImageVue>
        </template>
        {{ t("main.empty.content") }}
      </el-empty>
    </DropZoneVue>
  </template>

  <DialogVue type="success" v-model="successDialogVisible" :showCancelBtn="false">
    <template #title>
      {{ t("main.dialog.success.title") }}
    </template>
    <template #description>
      <span
        v-html="
          t('main.dialog.success.description', { count: main.taskQueue.success.length })
        "
      ></span>
    </template>
    <template #ok>
      {{ t("main.dialog.success.ok") }}
    </template>
  </DialogVue>  
</template>

<style lang="scss">
@use '@styles/modules/mixins' as mixins;
.virtual-table {
  .v-tr {
    .v-td {
      .compareSize {
        span {
          display: flex;
          gap: 4px;
        }
      }
      .remove {
        opacity: 0;
        cursor: pointer;
      }
    }
    &:hover {
      .v-td {
        .remove {
          opacity: 0.8;
          &:hover {
            opacity: 1;
            img {
              background-color: var(--color-bg-hover);
              border-radius: 4px;
            }
          }
        }
      }
    }
  }
}
.footer {
  .progress {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 100%;
  }
  .progress-status {
    color: var(--color-text-primary);
    font-size: 13px;
    display: flex;
    gap: 8px;
  }
}
</style>
