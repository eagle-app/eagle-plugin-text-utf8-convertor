<script setup>
import { t, useContextMenu } from '@/composables';
import { reactive } from 'vue';

const main = inject('main');

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['update:modelValue']);

const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

const default_setting = reactive({
    jpg: {
        algorithm:
            localStorage.getItem(
                `eagle.plugin.${eagle.plugin.manifest.id}.setting.jpg.algorithm`
            ) ?? 'jpegtran',
        quality:
            localStorage.getItem(`eagle.plugin.${eagle.plugin.manifest.id}.setting.jpg.quality`) ??
            90
    },
    png: {
        algorithm:
            localStorage.getItem(
                `eagle.plugin.${eagle.plugin.manifest.id}.setting.png.algorithm`
            ) ?? 'optipng',
        quality:
            localStorage.getItem(`eagle.plugin.${eagle.plugin.manifest.id}.setting.png.quality`) ??
            90
    },
    gif: {
        algorithm:
            localStorage.getItem(
                `eagle.plugin.${eagle.plugin.manifest.id}.setting.gif.algorithm`
            ) ?? 'gifsicle',
        quality:
            localStorage.getItem(`eagle.plugin.${eagle.plugin.manifest.id}.setting.gif.quality`) ??
            90
    },
    webp: {
        algorithm:
            localStorage.getItem(
                `eagle.plugin.${eagle.plugin.manifest.id}.setting.webp.algorithm`
            ) ?? 'cwebp',
        quality:
            localStorage.getItem(`eagle.plugin.${eagle.plugin.manifest.id}.setting.webp.quality`) ??
            90
    },
    svg: {
        algorithm:
            localStorage.getItem(
                `eagle.plugin.${eagle.plugin.manifest.id}.setting.svg.algorithm`
            ) ?? 'svgo'
    }
});

const setting = {
    jpg: {
        format: 'JPEG',
        algorithm: {
            mozjpeg: {
                lossy: true
            },
            jpegtran: {
                lossy: false
            }
        }
    },
    png: {
        format: 'PNG',
        algorithm: {
            pngquant: {
                lossy: true
            },
            optipng: {
                lossy: false
            }
        }
    },
    gif: {
        format: 'GIF',
        algorithm: {
            gifsicleLossy: {
                lossy: true
            },
            gifsicle: {
                lossy: false
            }
        }
    },
    svg: {
        format: 'SVG',
        algorithm: {
            svgo: {
                lossy: false
            }
        }
    },
    webp: {
        format: 'WEBP',
        algorithm: {
            cwebp: {
                lossy: true
            }
        }
    }
};

const save = () => {
    for (let [key, value] of Object.entries(default_setting)) {
        for (let [k, v] of Object.entries(value)) {
            localStorage.setItem(`eagle.plugin.${eagle.plugin.manifest.id}.setting.${key}.${k}`, v);
            main.setting[key][k] = v;
        }
    }
    visible.value = false;

    console.log('saved');
};
</script>

<template>
    <el-dialog v-model="visible" append-to-body align-center class="setting-dialog-vue">
        <div class="title">
            {{ t('main.setting.title') }}
            <ImageVue
                class="icon close"
                width="24"
                height="24"
                src="light/ic-dialog-close.svg"
                darkSrc="dark/ic-dialog-close.svg"
                @click="visible = false"
            >
            </ImageVue>
        </div>
        <table>
            <thead>
                <tr>
                    <th class="format">{{ t('main.setting.format') }}</th>
                    <th class="algorithm">{{ t('main.setting.algorithm') }}</th>
                    <th class="quality">{{ t('main.setting.quality') }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(value, key) in setting" :key="key">
                    <td class="format">{{ value.format }}</td>
                    <td class="algorithm">
                        <el-select
                            v-model="default_setting[key].algorithm"
                            placement="bottom"
                            class="is-input"
                        >
                            <el-option
                                v-for="(data, algorithm) in value.algorithm"
                                :key="algorithm"
                                :value="algorithm"
                            >
                                <span style="width: 75px">{{ algorithm }}</span>
                                <span style="color: var(--color-text-tertiary)">{{
                                    data.lossy ? t('main.setting.lossy') : t('main.setting.noLossy')
                                }}</span>
                            </el-option>
                        </el-select>
                    </td>
                    <td class="quality">
                        <el-select
                            v-model="default_setting[key].quality"
                            placement="bottom"
                            class="is-input"
                            v-if="setting[key].algorithm[default_setting[key].algorithm].lossy"
                        >
                            <el-option
                                v-for="quality in Array.from(
                                    { length: (100 - 5) / 5 + 1 },
                                    (_, i) => 5 + i * 5
                                ).reverse()"
                                :key="quality"
                                :value="quality"
                                >{{ quality }}</el-option
                            >
                        </el-select>
                        <span style="padding: 0 16px" v-else>-</span>
                    </td>
                </tr>
            </tbody>
        </table>
        <el-button type="primary" class="save" @click="save">{{
            t('main.setting.save')
        }}</el-button>
    </el-dialog>
</template>

<style lang="scss">
@use '@styles/modules/mixins' as mixins;
.setting-dialog-vue {
    min-width: 400px !important;
    padding: 0 16px !important;
    .title {
        height: 16px;
        color: var(--color-text-primary);
        font-weight: var(--font-weight-bold);
        font-size: 14px;
        margin: 16px 0;
        .close {
            float: right;
        }
    }
    table {
        width: 100%;
        border: 1px solid var(--color-border-primary);
        border-radius: 8px;
        border-spacing: 0;
        thead {
            box-shadow: 0 1px 0 0 var(--color-border-secondary);
            tr {
                th {
                    text-align: left;
                    padding: 0 12px !important;
                    height: 28px;
                    font-size: 12px;
                    color: var(--color-text-tertiary);
                }
            }
        }
        tbody {
            tr {
                &:nth-child(odd) {
                    --background-color: var(--color-dark-3);
                    @include mixins.dark {
                        --background-color: var(--color-lightgray-3);
                    }
                    background-color: var(--background-color);
                }
                td {
                    height: 36px;
                    font-size: 13px;
                    color: var(--color-text-primary);
                }
            }
        }
        .format,
        .algorithm,
        .quality {
            padding: 4px;
        }
        .format {
            padding: 12px;
        }
        .format,
        .quality {
            width: 80px;
        }
    }
    .save {
        width: 100%;
        margin: 16px 0;
    }
}
</style>
